import { validate as isUUID } from "uuid";
import { AppDataSource } from "@/database/data-source";
import { Election, ElectionStatus } from "@/database/entities/Election";
import { Category } from "@/database/entities/Category";
import { Nominee } from "@/database/entities/Nominee";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { parsePagination, buildPaginationMeta } from "@/lib/http/pagination";
import { PaginationQuery } from "@/types/pagination.type";
import { FindOptionsWhere, ILike } from "typeorm";

export class PublicService {
  /**
   * Active elections only — this is the guest-facing "browse elections" list.
   * Draft elections (not yet launched) and closed elections are intentionally
   * excluded; closed elections still have a results page but aren't meant to
   * be discoverable for new votes.
   */

  static async getActiveElections(query: PaginationQuery & { title?: string }) {
    const db = await AppDataSource();
    const repo = db.getRepository(Election);

    const where: FindOptionsWhere<Election> = { status: ElectionStatus.ACTIVE, isDeleted: false };
    if (query.title) where.title = ILike(`%${query.title}%`);

    const { page, limit, skip, take } = parsePagination({
      page: query.page?.toString(),
      limit: query.limit?.toString(),
    });

    const [elections, count] = await repo.findAndCount({
      where,
      select: {
        id: true, title: true, alias: true, slug: true, description: true,
        startDate: true, endDate: true, pricePerVote: true, status: true, bannerUrl: true,
      },
      order: { createdAt: "DESC" },
      skip,
      take,
    });

    return { elections, pagination: buildPaginationMeta(count, page, limit) };
  }

  static async getUpcomingElections(query: PaginationQuery) {
    const db = await AppDataSource();
    const repo = db.getRepository(Election);

    const { page, limit, skip, take } = parsePagination({
      page: query.page?.toString(),
      limit: query.limit?.toString(),
    });

    const [elections, count] = await repo.findAndCount({
      where: { status: ElectionStatus.DRAFT, isDeleted: false },
      select: {
        id: true, title: true, alias: true, slug: true, description: true,
        startDate: true, endDate: true, pricePerVote: true, status: true, bannerUrl: true,
      },
      order: { startDate: "ASC" }, // soonest upcoming first
      skip,
      take,
    });

    return { elections, pagination: buildPaginationMeta(count, page, limit) };
  }

  /**
   * Closed elections — same shape as getActiveElections, for any UI that
   * wants a paginated "past elections" list (e.g. an archive/results page).
   */
  static async getPastElections(query: PaginationQuery & { title?: string }) {
    const db = await AppDataSource();
    const repo = db.getRepository(Election);

    const where: FindOptionsWhere<Election> = { status: ElectionStatus.CLOSED, isDeleted: false };
    if (query.title) where.title = ILike(`%${query.title}%`);

    const { page, limit, skip, take } = parsePagination({
      page: query.page?.toString(),
      limit: query.limit?.toString(),
    });

    const [elections, count] = await repo.findAndCount({
      where,
      select: {
        id: true, title: true, alias: true, slug: true, description: true,
        startDate: true, endDate: true, pricePerVote: true, status: true, bannerUrl: true,
      },
      order: { endDate: "DESC" }, // most recently closed first
      skip,
      take,
    });

    return { elections, pagination: buildPaginationMeta(count, page, limit) };
  }

  /**
   * Full election detail with its live categories/nominees, for the voting page.
   * Accepts either a real id or the slug, so the frontend can use pretty URLs.
   *
   * IMPORTANT: id and slug must be queried separately, not as a single OR
   * condition — Postgres validates the "id" column's UUID type for every
   * branch of an OR, so passing a non-UUID slug into an { id, slug } OR where
   * clause throws a driver-level "invalid input syntax for type uuid" error
   * before it ever gets to check the slug branch. Detecting the identifier
   * type up front avoids this entirely.
   */
  static async getElectionDetail(idOrSlug: string) {
    const db = await AppDataSource();

    const election = await db.getRepository(Election).findOne({
      where: isUUID(idOrSlug)
        ? { id: idOrSlug, isDeleted: false }
        : { slug: idOrSlug, isDeleted: false },
      select: {
        id: true,
        title: true,
        alias: true,
        slug: true,
        description: true,
        startDate: true,
        endDate: true,
        pricePerVote: true,
        status: true,
        bannerUrl: true,
      },
    });

    if (!election || election.status === ElectionStatus.DRAFT) {
      throw new CustomAppError( "No election found", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "election_not_found" );
    }

    // Explicit query builder so isDeleted filtering actually applies to the
    // nested nominees too — a plain relations-based find() only filters the
    // top-level entity, not related rows.
    const categories = await db
      .getRepository(Category)
      .createQueryBuilder("category")
      .leftJoinAndSelect(
        "category.nominees",
        "nominee",
        "nominee.isDeleted = false"
      )
      .where("category.election.id = :electionId", { electionId: election.id })
      .andWhere("category.isDeleted = false")
      .orderBy("category.displayOrder", "ASC")
      .addOrderBy("nominee.name", "ASC")
      .getMany();

    return {
      ...election,
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        displayOrder: c.displayOrder,
        nominees: c.nominees.map((n) => ({
          id: n.id,
          name: n.name,
          bio: n.bio,
          imageUrl: n.imageUrl,
          code: n.code,
        })),
      })),
    };
  }

  /**
   * Single category with its nominees — for the category drill-down page.
   * Excludes categories belonging to a draft election, same visibility rule
   * as election/nominee detail.
   */
  static async getCategoryDetail(categoryId: string) {
    if (!isUUID(categoryId)) {
      throw new CustomAppError( "Invalid category id", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const db = await AppDataSource();

    const category = await db
      .getRepository(Category)
      .createQueryBuilder("category")
      .leftJoinAndSelect("category.election", "election")
      .leftJoinAndSelect(
        "category.nominees",
        "nominee",
        "nominee.isDeleted = false"
      )
      .where("category.id = :categoryId", { categoryId })
      .andWhere("category.isDeleted = false")
      .orderBy("nominee.name", "ASC")
      .getOne();

    if (!category || category.election.status === ElectionStatus.DRAFT) {
      throw new CustomAppError( "No category found", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "category_not_found" );
    }

    return {
      id: category.id,
      name: category.name,
      description: category.description,
      election: {
        id: category.election.id,
        title: category.election.title,
        slug: category.election.slug,
        status: category.election.status,
        pricePerVote: category.election.pricePerVote,
        bannerUrl: category.election.bannerUrl,
      },
      nominees: category.nominees.map((n) => ({
        id: n.id,
        name: n.name,
        bio: n.bio,
        imageUrl: n.imageUrl,
        code: n.code,
      })),
    };
  }

  /**
   * Public nominee profile — minimal, safe-to-expose fields only, plus
   * enough parent context (category name, election title/status) for a
   * standalone nominee page to render without extra requests.
   */
  static async getNomineePublicProfile(id: string) {
    if (!isUUID(id)) {
      throw new CustomAppError( "Invalid nominee id", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const db = await AppDataSource();

    const nominee = await db.getRepository(Nominee).findOne({
      where: { id, isDeleted: false },
      relations: { category: { election: true } },
      select: {
        id: true,
        name: true,
        bio: true,
        imageUrl: true,
        code: true,
        category: {
          id: true,
          name: true,
          election: { id: true, title: true, slug: true, status: true },
        },
      },
    });

    if (!nominee || nominee.category.election.status === ElectionStatus.DRAFT) {
      throw new CustomAppError( "No nominee found", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "nominee_not_found" );
    }

    return {
      id: nominee.id,
      name: nominee.name,
      bio: nominee.bio,
      imageUrl: nominee.imageUrl,
      code: nominee.code,
      category: { id: nominee.category.id, name: nominee.category.name },
      election: {
        id: nominee.category.election.id,
        title: nominee.category.election.title,
        slug: nominee.category.election.slug,
        status: nominee.category.election.status,
      },
    };
  }

  static async getNomineeByCode(code: string) {
    if (!code?.trim()) {
      throw new CustomAppError( "Nominee code is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const db = await AppDataSource();

    const nominee = await db.getRepository(Nominee).findOne({
      where: { code: code.trim().toUpperCase(), isDeleted: false },
      relations: { category: { election: true } },
      select: {
        id: true, name: true, bio: true, imageUrl: true, code: true,
        category: {
          id: true, name: true,
          election: { id: true, title: true, slug: true, status: true, pricePerVote: true },
        },
      },
    });

    if (!nominee || nominee.category.election.status === ElectionStatus.DRAFT) {
      throw new CustomAppError( "No nominee found with this code", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "nominee_not_found" );
    }

    return {
      id: nominee.id,
      name: nominee.name,
      bio: nominee.bio,
      imageUrl: nominee.imageUrl,
      code: nominee.code,
      category: { id: nominee.category.id, name: nominee.category.name },
      election: {
        id: nominee.category.election.id,
        title: nominee.category.election.title,
        slug: nominee.category.election.slug,
        status: nominee.category.election.status,
        pricePerVote: nominee.category.election.pricePerVote,
      },
    };
  }

}