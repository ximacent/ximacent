import { validateCreateElection, validateStatusTransition, validateUpdateElection } from "@/modules/election/election.validator";
import { validate as isUUID } from "uuid";
import { FindOptionsWhere, ILike, In, Not } from "typeorm";
import { AppDataSource } from "@/database/data-source";
import { Election, ElectionStatus } from "@/database/entities/Election";
import { User } from "@/database/entities/User";
import { CreateElectionDTO, FilterElectionDTO, UpdateElectionDTO, UpdateElectionStatusDTO, } from "@/types/election.type";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { generateUniqueAlias, generateUniqueSlug } from "@/utils/helpers/election.helper";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { PaginationQuery } from "@/types/pagination.type";
import { createWithImages, ImageFileInput } from "@/lib/storage/createWithImages";
import { getStorageAdapter } from "@/lib/storage/getStorageAdapter";

export class ElectionService {
  private static async repo() {
    const db = await AppDataSource();
    return db.getRepository(Election);
  }

  static async getElections(filters: FilterElectionDTO & PaginationQuery) {
      const repo = await this.repo();

      const where: FindOptionsWhere<Election> = {
        isDeleted: false,
      };

      if (filters.title) { where.title = ILike(`%${filters.title}%`); }
      if (filters.status) {
        if (!Object.values(ElectionStatus).includes(filters.status as ElectionStatus)) {
          throw new CustomAppError( "Invalid status filter", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed" );
        }
        where.status = filters.status as ElectionStatus;
      }
      if (filters.createdById) {
        if (!isUUID(filters.createdById)) {
          throw new CustomAppError( "Valid createdById is required", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed" );
        }
        where.createdBy = { id: filters.createdById };
      }

      const { page, limit, skip, take } = parsePagination({
        page: filters.page?.toString(),
        limit: filters.limit?.toString(),
      });

      const [elections, count] = await repo.findAndCount({
        where,
        order: { createdAt: "DESC" },
        skip,
        take,
      });

      return { elections, pagination: buildPaginationMeta(count, page, limit) };
  }

  static async getElection(id: string) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError( "Valid Election ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const repo = await this.repo();

    const election = await repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!election) {
      throw new CustomAppError( "No election found with the given ID", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "election_not_found" );
    }

    return election;
  }

  static async create(data: CreateElectionDTO, createdById: string) {
    validateCreateElection(data);

    const repo = await this.repo();
    const db = await AppDataSource();
    const userRepo = db.getRepository(User);

    const createdBy = await userRepo.findOne({ where: { id: createdById, isDeleted: false } });
    if (!createdBy) {
      throw new CustomAppError( "Authenticated user not found", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "user_not_found" );
    }

    const normalizedTitle = data.title.trim().toUpperCase();

    const existingElection = await repo.findOne({
      where: { title: normalizedTitle, isDeleted: false },
    });

    if (existingElection) {
      throw new CustomAppError( "Election with this title already exists", 400, ErrorCodes.RECORD_ALREADY_EXISTS.code, ErrorCodes.RECORD_ALREADY_EXISTS.label, "election_exists");
    }

    const alias = await generateUniqueAlias(normalizedTitle, repo);
    const slug  = await generateUniqueSlug(normalizedTitle, repo);

    const newElection = repo.create({
      title: normalizedTitle,
      description: data.description?.trim(),
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      status: ElectionStatus.DRAFT,
      pricePerVote: data.pricePerVote,
      alias,
      slug,
      createdBy,
    });

    return await repo.save(newElection);
  }

  static async update(id: string, data: UpdateElectionDTO) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError( "Valid Election ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const repo = await this.repo();

    const existingElection = await repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!existingElection) {
      throw new CustomAppError( "No election found with the given ID", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "election_not_found" );
    }

    validateUpdateElection(data, existingElection);

    const normalizedTitle = data.title?.trim().toUpperCase();

    if (normalizedTitle && normalizedTitle !== existingElection.title) {
      const duplicateElection = await repo.findOne({
        where: {
          title: normalizedTitle,
          isDeleted: false,
          id: Not(id),
        },
      });

      if (duplicateElection) {
        throw new CustomAppError( "Election with this title already exists", 400, ErrorCodes.RECORD_ALREADY_EXISTS.code, ErrorCodes.RECORD_ALREADY_EXISTS.label, "election_exists" );
      }
    }

    const updatedElection = repo.merge(existingElection, {
      ...data,
      ...(normalizedTitle && { title: normalizedTitle }),
      ...(data.startDate && { startDate: new Date(data.startDate) }),
      ...(data.endDate && { endDate: new Date(data.endDate) }),
      ...(data.description !== undefined && { description: data.description?.trim() }),
    });

    return await repo.save(updatedElection);
  }

  static async updateStatus(id: string, data: UpdateElectionStatusDTO) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError( "Valid Election ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const repo = await this.repo();
    const election = await repo.findOne({
      where: { id, isDeleted: false },
      relations: { categories: true },
    });

    if (!election) {
      throw new CustomAppError( "No election found with the given ID", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "election_not_found" );
    }

    validateStatusTransition(election, data.status);

    if (data.status === ElectionStatus.ACTIVE) {
      if (election.categories.length === 0) {
        throw new CustomAppError( "Cannot activate an election with no categories", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "no_categories" );
      }

      const now = new Date();
      if (now < election.startDate) {
        election.startDate = now; // activation IS the real start moment
      }
    }

    election.status = data.status;
    return await repo.save(election);
  }

  static async updateBanner(id: string, image: ImageFileInput) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError( "Valid Election ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const repo = await this.repo();
    const election = await repo.findOne({ where: { id, isDeleted: false } });

    if (!election) {
      throw new CustomAppError( "No election found with the given ID", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "election_not_found" );
    }

    const oldBannerUrl = election.bannerUrl;

    return await createWithImages(
      { ...image, fieldName: "bannerUrl" },
      async (urls) => {
        election.bannerUrl = urls.bannerUrl;
        const saved = await repo.save(election);
        if (oldBannerUrl) {
          await getStorageAdapter().delete(oldBannerUrl).catch(() => {});
        }
        return saved;
      },
      { folder: "elections" }
    );
  }

  static async delete(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => !isUUID(id))) {
      throw new CustomAppError( "Valid Election IDs are required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const repo = await this.repo();

    const records = await repo.find({
      where: {
        id: In(ids),
        isDeleted: false,
      },
    });

    if (records.length === 0) {
      throw new CustomAppError( "No matching records found to delete", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "not_found" );
    }

    records.forEach((record) => {
      record.isDeleted = true;
    });

    return repo.save(records);
  }
}