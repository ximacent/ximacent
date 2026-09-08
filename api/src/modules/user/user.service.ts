import { validateCreateUser, validatePasswordStrength, validateUserEnum } from "@/modules/user/user.validator";
import { validate as isUUID } from "uuid";
import { Brackets, In } from "typeorm";
import { AppDataSource } from "@/database/data-source";
import { User, UserRole } from "@/database/entities/User";
import { CreateUserDTO, FilterUserDTO, UpdateUserDTO } from "@/types/user.type";
import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import bcrypt from "bcrypt";
import { UserSanitizer } from "./user.sanitizer";
import { buildPaginationMeta, parsePagination } from "@/lib/http/pagination";
import { PaginationQuery } from "@/types/pagination.type";

export class UserService {

  private static withoutPassword(user: User) {
    const { passwordHash: _password, ...safeUser } = user;
    return safeUser;
  }

  private static async repo() {
    const db = await AppDataSource();
    return db.getRepository(User);
  }

  static async getUsers(filters: FilterUserDTO & PaginationQuery) {
      const repo = await this.repo();
      const usersQuery = repo
        .createQueryBuilder("user")
        .where("user.isDeleted = :isDeleted", { isDeleted: false });

      if (filters.phone) {
        usersQuery.andWhere("user.phone ILIKE :phone", {
          phone: `%${filters.phone.trim()}%`,
        });
      }
      if (filters.role) {
        usersQuery.andWhere("user.role = :role", { role: filters.role as UserRole });
      }
      if (filters.isVerified !== undefined) {
        usersQuery.andWhere("user.isVerified = :isVerified", {
          isVerified: filters.isVerified,
        });
      }

      const searchTerms = filters.search?.trim().split(/\s+/).filter(Boolean) ?? [];
      searchTerms.forEach((term, index) => {
        const parameter = `searchTerm${index}`;
        const pattern = `%${term}%`;

        usersQuery.andWhere(
          new Brackets((searchQuery) => {
            searchQuery
              .where(`user.firstName ILIKE :${parameter}`, { [parameter]: pattern })
              .orWhere(`user.lastName ILIKE :${parameter}`, { [parameter]: pattern })
              .orWhere(`user.email ILIKE :${parameter}`, { [parameter]: pattern });
          })
        );
      });

      const { page, limit, skip, take } = parsePagination({
        page: filters.page?.toString(),
        limit: filters.limit?.toString(),
      });

      const [users, count] = await usersQuery
        .orderBy("user.createdAt", "DESC")
        .skip(skip)
        .take(take)
        .getManyAndCount();

      return { users: users.map(this.withoutPassword), pagination: buildPaginationMeta(count, page, limit) };
  }

  static async getUser(id: string) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError("Valid User ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request");
    }

    const repo = await this.repo();

    const user = await repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!user) {
      throw new CustomAppError("No user found with the given ID", 404, ErrorCodes.USER_NOT_FOUND.code, ErrorCodes.USER_NOT_FOUND.label, "user_not_found");
    }

    return this.withoutPassword(user);
  }

  static async create(data: CreateUserDTO) {
      const repo = await this.repo();

      const safeData = UserSanitizer.create(data);

      validateCreateUser(safeData); // now internally covers presence + enum + password strength

      const existingUser = await repo.findOne({
        where: { email: safeData.email, isDeleted: false },
      });

      if (existingUser) {
        throw new CustomAppError("User with this email already exists", 400, ErrorCodes.RECORD_ALREADY_EXISTS.code, ErrorCodes.RECORD_ALREADY_EXISTS.label, "user_exists");
      }

      const passwordHash = await bcrypt.hash(safeData.passwordHash, 10);

      const newUser = repo.create({
        firstName: safeData.firstName,
        lastName: safeData.lastName,
        phone: safeData.phone,
        email: safeData.email,
        role: safeData.role,
        passwordHash,
      });

      return this.withoutPassword(await repo.save(newUser));
  }

  static async update(id: string, data: UpdateUserDTO) {
    if (!id || !isUUID(id)) {
      throw new CustomAppError("Valid User ID is required", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request");
    }

    const safeData = UserSanitizer.update(data); // strips phoneNumber, email, role, passwordHash, isActive, anything not in the allowlist
    validateUserEnum(safeData);

    const repo = await this.repo();

    const existingUser = await repo.findOne({ where: { id, isDeleted: false } });
    if (!existingUser) {
      throw new CustomAppError("No user found with the given ID", 404, ErrorCodes.USER_NOT_FOUND.code, ErrorCodes.USER_NOT_FOUND.label, "user_not_found");
    }

    const updatedUser = repo.merge(existingUser, safeData);
    return this.withoutPassword(await repo.save(updatedUser));
  }

  static async delete(ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new CustomAppError("Invalid request IDs", 400, ErrorCodes.ID_REQUIRED.code, ErrorCodes.ID_REQUIRED.label, "bad_request");
    }

    const repo = await this.repo();

    const records = await repo.find({
      where: { id: In(ids), isDeleted: false },
    });

    if (records.length === 0) {
      throw new CustomAppError("No matching records found to delete", 404, ErrorCodes.RECORD_NOT_FOUND.code, ErrorCodes.RECORD_NOT_FOUND.label, "not_found");
    }

    records.forEach(record => {
      record.isDeleted = true;
    });

    return repo.save(records);
  }
}