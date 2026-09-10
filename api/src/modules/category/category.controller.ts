import { CategoryService } from "./category.service";
import type { CreateCategoryDTO, UpdateCategoryDTO, FilterCategoryDTO } from "@/types/category.type";

export class CategoryController {
  static async getCategories(data: FilterCategoryDTO) {
    return await CategoryService.getCategories(data);
  }

  static async getCategory(id: string) {
    return await CategoryService.getCategory(id);
  }

  static async createCategory(data: CreateCategoryDTO | CreateCategoryDTO[]) {
    return Array.isArray(data)
      ? await CategoryService.createMany(data)
      : await CategoryService.create(data);
  }

  static async updateCategory(id: string, data: UpdateCategoryDTO) {
    return await CategoryService.update(id, data);
  }

  static async deleteCategories(ids: string[]) {
    return await CategoryService.delete(ids);
  }
}