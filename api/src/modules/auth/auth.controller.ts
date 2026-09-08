import { AuthService } from "@/modules/auth/auth.service";
import type { LoginDTO } from "@/types/auth.type";

export class AuthController {
  static async login(data: LoginDTO) {
    return await AuthService.login(data);
  }
}