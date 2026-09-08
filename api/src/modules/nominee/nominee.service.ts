import { validateCreateNominee, validateUpdateNominee } from "@/modules/nominee/nominee.validator";
import { validate as isUUID } from "uuid";
import { FindOptionsWhere, ILike, In, Not } from "typeorm";
import { AppDataSource } from "@/database/data-source";
import { Nominee } from "@/database/entities/Nominee";
import { Category } from "@/database/entities/Category";
import { CreateNomineeDTO, FilterNomineeDTO, UpdateNomineeDTO } from "@/types/nominee.type";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { generateNomineeCode } from "@/utils/helpers/nominee.helper";
import { createWithImages, ImageFileInput } from "@/lib/storage/createWithImages";
import { getStorageAdapter } from "@/lib/storage/getStorageAdapter";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { PaginationQuery } from "@/types/pagination.type";

export class NomineeService {
  private static async repo() {
    const db = await AppDataSource();
    return db.getRepository(Nominee);
  }

  static async getNominees(filters: FilterNomineeDTO & PaginationQuery) {
      const repo = await this.repo();
      const where: FindOptionsWhere<Nominee> = { isDeleted: false };

      if (filters.name) where.name = ILike(`%${filters.name}%`);
      if (filters.code) where.code = filters.code;
      if (filters.categoryId) {
        if (!isUUID(filters.categoryId)) {
          throw new CustomAppError( "Valid categoryId is required", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed" );
        }
        where.category = { id: filters.categoryId };
      }

      const { page, limit, skip, take } = parsePagination({
        page: filters.page?.toString(),
        limit: filters.limit?.toString(),
      });

      const [nominees, count] = await repo.findAndCount({
        where,
        relations: { category: true },
        order: { createdAt: "DESC" },
        skip,
        take,
      });

      return { nominees, pagination: buildPaginationMeta(count, page, limit) };
  }

  static async getNominee(id: string) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError( "Valid Nominee ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const repo = await this.repo();
    const nominee = await repo.findOne({ where: { id, isDeleted: false }, relations: { category: true } });

    if (!nominee) {
      throw new CustomAppError( "No nominee found with the given ID", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "nominee_not_found" );
    }

    return nominee;
  }

  static async create(data: CreateNomineeDTO, image?: ImageFileInput) {
    validateCreateNominee(data);

    const repo = await this.repo();
    const db = await AppDataSource();
    const categoryRepo = db.getRepository(Category);

    const category = await categoryRepo.findOne({
      where: { id: data.categoryId, isDeleted: false },
      relations: { election: true },
    });

    if (!category) {
      throw new CustomAppError( "No category found with this categoryId", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "category_not_found" );
    }

    const normalizedName = data.name.trim();

    const existingNominee = await repo.findOne({
      where: { name: normalizedName, category: { id: data.categoryId }, isDeleted: false },
    });

    if (existingNominee) {
      throw new CustomAppError( "Nominee with this name already exists in this category", 400, ErrorCodes.RECORD_ALREADY_EXISTS.code, ErrorCodes.RECORD_ALREADY_EXISTS.label, "nominee_exists" );
    }

    const code = await generateNomineeCode(category.election.title, repo);

    const buildAndSave = (imageUrl?: string) =>
      repo.save(repo.create({
        name: normalizedName,
        bio: data.bio?.trim(),
        category,
        code,
        imageUrl,
      }));

    if (image) {
      return await createWithImages(
        { ...image, fieldName: "imageUrl" },
        (urls) => buildAndSave(urls.imageUrl),
        { folder: "nominees" }
      );
    }

    return await buildAndSave(undefined);
  }

  static async update(id: string, data: UpdateNomineeDTO, image?: ImageFileInput) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError( "Valid Nominee ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    validateUpdateNominee(data);

    const repo = await this.repo();
    const existingNominee = await repo.findOne({
      where: { id, isDeleted: false },
      relations: { category: { election: true } },
    });

    if (!existingNominee) {
      throw new CustomAppError( "No nominee found with the given ID", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "nominee_not_found" );
    }

    let category = existingNominee.category;
    if (data.categoryId && data.categoryId !== existingNominee.category.id) {
      const db = await AppDataSource();
      const found = await db.getRepository(Category).findOne({
        where: { id: data.categoryId, isDeleted: false },
        relations: { election: true },
      });

      if (!found) {
        throw new CustomAppError( "No category found with this categoryId", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "category_not_found" );
      }

      if (found.election.id !== existingNominee.category.election.id) {
        throw new CustomAppError( "Cannot move a nominee to a category in a different election", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "cross_election_move" );
      }

      category = found;
    }

    const normalizedName = data.name?.trim();

    if (normalizedName && normalizedName !== existingNominee.name) {
      const duplicateNominee = await repo.findOne({
        where: { name: normalizedName, category: { id: category.id }, isDeleted: false, id: Not(id) },
      });

      if (duplicateNominee) {
        throw new CustomAppError( "Nominee with this name already exists in this category", 400, ErrorCodes.RECORD_ALREADY_EXISTS.code, ErrorCodes.RECORD_ALREADY_EXISTS.label, "nominee_exists" );
      }
    }

    const baseUpdate = {
      ...(normalizedName && { name: normalizedName }),
      ...(data.bio !== undefined && { bio: data.bio?.trim() }),
      category,
    };

    if (image) {
      const oldImageUrl = existingNominee.imageUrl;

      return await createWithImages(
        { ...image, fieldName: "imageUrl" },
        async (urls) => {
          const saved = await repo.save(repo.merge(existingNominee, { ...baseUpdate, imageUrl: urls.imageUrl }));
          if (oldImageUrl) {
            await getStorageAdapter().delete(oldImageUrl).catch(() => {});
          }
          return saved;
        },
        { folder: "nominees" }
      );
    }

    return await repo.save(repo.merge(existingNominee, baseUpdate));
  }

  static async delete(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => !isUUID(id))) {
      throw new CustomAppError( "Valid Nominee IDs are required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const repo = await this.repo();
    const records = await repo.find({ where: { id: In(ids), isDeleted: false } });

    if (records.length === 0) {
      throw new CustomAppError( "No matching records found to delete", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "not_found" );
    }

    records.forEach((record) => { record.isDeleted = true; });
    return repo.save(records);
  }
}