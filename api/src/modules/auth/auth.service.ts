import bcrypt from "bcrypt";
import { AppDataSource } from "../../database/data-source";
import { User } from "../../database/entities/User";
import { signAccessToken, signRefreshToken } from "../../lib/jwt";
import { CustomAppError } from "../../lib/errors/customAppError";
import { ErrorCodes } from "../../lib/errors/errorCodes";
import { LoginDTO } from "@/types/auth.type";

export class AuthService {
  private static async repo() {
    const db = await AppDataSource();
    return db.getRepository(User);
  }

  static async login(data: LoginDTO) {
    const repo = await this.repo();

    if (!data.email) throw new CustomAppError( "Email is required", 401, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "unauthorized" );
    if (!data.password) throw new CustomAppError( "Password is required", 401, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "unauthorized" );

    const user = await repo.findOne({ where: { email: data.email, isDeleted: false } });

    if (!user) {
      throw new CustomAppError( "Invalid email or password", 401, ErrorCodes.INVALID_CREDENTIALS.code, ErrorCodes.INVALID_CREDENTIALS.label, "unauthorized" );
    }

    // if (!user.isVerified) {
    //   throw new CustomAppError( "This account is not verified", 403, ErrorCodes.ACCOUNT_INACTIVE.code, ErrorCodes.ACCOUNT_INACTIVE.label, "forbidden" );
    // }

    const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

    if (!passwordMatches) {
      throw new CustomAppError( "Invalid phone number or password", 401, ErrorCodes.INVALID_CREDENTIALS.code, ErrorCodes.INVALID_CREDENTIALS.label, "unauthorized" );
    }

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }
}