import { UserService } from "./user.service";
import type { CreateUserDTO, UpdateUserDTO, FilterUserDTO } from "@/types/user.type";

export class UserController {
  static async getUsers(data: FilterUserDTO) {
    return await UserService.getUsers(data);
  }

  static async getUser(id: string) {
    return await UserService.getUser(id);
  }

  static async createUser(data: CreateUserDTO) {
    return await UserService.create(data);
  }

  static async updateUser(id: string, data: UpdateUserDTO) {
    return await UserService.update(id, data)
  }
  
  static async deleteUsers(ids: string[]) {
    return await UserService.delete(ids);
  }
}