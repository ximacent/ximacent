import { validateCreateCategory, validateUpdateCategory } from "@/modules/category/category.validator";
import { validate as isUUID } from "uuid";
import { FindOptionsWhere, ILike, In, Not } from "typeorm";
import { AppDataSource } from "@/database/data-source";
import { Category } from "@/database/entities/Category";
import { Election } from "@/database/entities/Election";
import { CreateCategoryDTO, FilterCategoryDTO, UpdateCategoryDTO } from "@/types/category.type";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { PaginationQuery } from "@/types/pagination.type";

export class CategoryService {
  private static async repo() {
    const db = await AppDataSource();
    return db.getRepository(Category);
  }

  static async getCategories(filters: FilterCategoryDTO & PaginationQuery) {
      const repo = await this.repo();

      const where: FindOptionsWhere<Category> = {
        isDeleted: false,
      };

      if (filters.name) { where.name = ILike(`%${filters.name}%`); }
      if (filters.electionId) {
        if (!isUUID(filters.electionId)) {
          throw new CustomAppError( "Valid electionId is required", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed" );
        }
        where.election = { id: filters.electionId };
      }

      const { page, limit, skip, take } = parsePagination({
        page: filters.page?.toString(),
        limit: filters.limit?.toString(),
      });

      const [categories, count] = await repo.findAndCount({
        where,
        relations: { election: true },
        order: { displayOrder: "ASC", createdAt: "ASC" },
        skip,
        take,
      });

      return { categories, pagination: buildPaginationMeta(count, page, limit) };
  }

  static async getCategory(id: string) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError( "Valid Category ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    const repo = await this.repo();

    const category = await repo.findOne({
      where: { id, isDeleted: false },
      relations: { election: true },
    });

    if (!category) {
      throw new CustomAppError( "No category found with the given ID", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "category_not_found" );
    }

    return category;
  }

  static async create(data: CreateCategoryDTO) {
    validateCreateCategory(data);

    const repo = await this.repo();
    const db = await AppDataSource();
    const electionRepo = db.getRepository(Election);

    const election = await electionRepo.findOne({
      where: { id: data.electionId, isDeleted: false },
    });

    if (!election) {
      throw new CustomAppError( "No election found with this electionId", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "election_not_found" );
    }

    const normalizedName = data.name.trim();

    const existingCategory = await repo.findOne({
      where: {
        name: normalizedName,
        election: { id: data.electionId },
        isDeleted: false,
      },
    });

    if (existingCategory) {
      throw new CustomAppError( "Category with this name already exists for this election", 400, ErrorCodes.RECORD_ALREADY_EXISTS.code, ErrorCodes.RECORD_ALREADY_EXISTS.label, "category_exists" );
    }

    const newCategory = repo.create({
      name: normalizedName,
      description: data.description?.trim(),
      displayOrder: data.displayOrder ?? 0,
      election,
    });

    return await repo.save(newCategory);
  }

  static async update(id: string, data: UpdateCategoryDTO) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError( "Valid Category ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
    }

    validateUpdateCategory(data);

    const repo = await this.repo();

    const existingCategory = await repo.findOne({
      where: { id, isDeleted: false },
      relations: { election: true },
    });

    if (!existingCategory) {
      throw new CustomAppError( "No category found with the given ID", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "category_not_found" );
    }

    const normalizedName = data.name?.trim();

    if (normalizedName && normalizedName !== existingCategory.name) {
      const duplicateCategory = await repo.findOne({
        where: {
          name: normalizedName,
          election: { id: existingCategory.election.id },
          isDeleted: false,
          id: Not(id),
        },
      });

      if (duplicateCategory) {
        throw new CustomAppError( "Category with this name already exists for this election", 400, ErrorCodes.RECORD_ALREADY_EXISTS.code, ErrorCodes.RECORD_ALREADY_EXISTS.label, "category_exists" );
      }
    }

    const updatedCategory = repo.merge(existingCategory, {
      ...data,
      ...(normalizedName && { name: normalizedName }),
      ...(data.description !== undefined && { description: data.description?.trim() }),
    });

    return await repo.save(updatedCategory);
  }

  static async delete(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0 || ids.some((id) => !isUUID(id))) {
      throw new CustomAppError( "Valid Category IDs are required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request" );
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