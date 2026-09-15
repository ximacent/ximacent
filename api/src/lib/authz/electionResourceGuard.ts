import { AppDataSource } from "@/database/data-source";
import { In } from "typeorm";
import { Category } from "@/database/entities/Category";
import { Nominee } from "@/database/entities/Nominee";
import { Election } from "@/database/entities/Election";
import { UserRole } from "@/database/entities/User";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { OrganizerService } from "@/modules/organizer/organizer.service";

export type ResourceActor = { id: string; role: UserRole };

function forbidden(): never {
  throw new CustomAppError(
    "You do not have permission to perform this operation",
    403,
    ErrorCodes.PERMISSION_DENIED.code,
    ErrorCodes.PERMISSION_DENIED.label,
    "forbidden"
  );
}

/**
 * Authorizes a mutation on a category/nominee by resolving which election
 * it belongs to and checking the actor against that election.
 *
 * Admin/super_admin: always allowed (existing behavior, unchanged).
 * Organizer: must OWN the election AND currently be an APPROVED organizer
 * (re-read fresh from the DB via OrganizerService.requireApprovedOrganizer,
 * so a suspended organizer immediately loses access to categories/nominees
 * too, not just to the election itself).
 * Anyone else (voter): denied.
 */
export async function assertCanManageElection(actor: ResourceActor, electionId: string) {
  if (actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN) return;
  if (actor.role !== UserRole.ORGANIZER) forbidden();

  await OrganizerService.requireApprovedOrganizer(actor.id);

  const db = await AppDataSource();
  const election = await db.getRepository(Election).findOne({
    where: { id: electionId, isDeleted: false },
    relations: { createdBy: true },
  });

  if (!election) {
    throw new CustomAppError(
      "No election found with the given ID",
      404,
      ErrorCodes.RECORD_NOT_FOUND.code,
      ErrorCodes.RECORD_NOT_FOUND.label,
      "election_not_found"
    );
  }

  if (election.createdBy?.id !== actor.id) forbidden();
}

/** Resolves each category's election, then authorizes against it. */
export async function assertCanManageCategories(actor: ResourceActor, categoryIds: string[]) {
  if (actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN) return;
  if (!categoryIds.length) return;

  const db = await AppDataSource();
  const categories = await db.getRepository(Category).find({
    where: { id: In(categoryIds), isDeleted: false },
    relations: { election: true },
  });

  if (categories.length !== new Set(categoryIds).size) forbidden();

  // All-or-nothing, matching the bulk-delete convention used elsewhere in
  // this codebase (e.g. UserService.delete): if any single target isn't
  // the actor's, the whole request is denied rather than partially applied.
  for (const category of categories) {
    await assertCanManageElection(actor, category.election.id);
  }
}

/** Resolves each nominee's category -> election, then authorizes. */
export async function assertCanManageNominees(actor: ResourceActor, nomineeIds: string[]) {
  if (actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN) return;
  if (!nomineeIds.length) return;

  const db = await AppDataSource();
  const nominees = await db.getRepository(Nominee).find({
    where: { id: In(nomineeIds), isDeleted: false },
    relations: { category: { election: true } },
  });

  if (nominees.length !== new Set(nomineeIds).size) forbidden();

  for (const nominee of nominees) {
    await assertCanManageElection(actor, nominee.category.election.id);
  }
}
