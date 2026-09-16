import { AuthService } from "@/modules/auth/auth.service";
import type { LoginDTO, RequestEmailVerificationDTO, VerifyEmailOTPDTO, ChangePasswordDTO, RequestPasswordResetDTO, ResetPasswordDTO, ConfirmPhoneChangeDTO, RequestPhoneChangeDTO, ConfirmEmailChangeDTO, RequestEmailChangeDTO } from "@/types/auth.type";

export class AuthController {
  static async login(data: LoginDTO) {
    return await AuthService.login(data);
  }

  static async register(data: unknown, ipAddress?: string) {
    return await AuthService.register(data, ipAddress);
  }

  static async requestEmailVerification(data: RequestEmailVerificationDTO) {
    return await AuthService.requestEmailVerification(data);
  }

  static async verifyEmailOTP(data: VerifyEmailOTPDTO) {
    return await AuthService.verifyEmailOTP(data);
  }

  static async adminVerifyEmail(userId: string, adminId: string) {
    return await AuthService.adminVerifyEmail(userId, adminId);
  }

  static async requestPhoneVerification(userId: string) {
    return await AuthService.requestPhoneVerification(userId);
  }

  static async verifyPhoneOTP(userId: string, otp: string) {
    return await AuthService.verifyPhoneOTP(userId, otp);
  }

  static async changePassword(userId: string, data: ChangePasswordDTO) {
    return await AuthService.changePassword(userId, data);
  }

  static async requestPasswordReset(data: RequestPasswordResetDTO) {
    return await AuthService.requestPasswordReset(data);
  }

  static async resetPassword(data: ResetPasswordDTO) {
    return await AuthService.resetPassword(data);
  }

  static async requestPhoneChange(userId: string, data: RequestPhoneChangeDTO) {
    return await AuthService.requestPhoneChange(userId, data);
  }

  static async confirmPhoneChange(userId: string, data: ConfirmPhoneChangeDTO) {
    return await AuthService.confirmPhoneChange(userId, data);
  }

  static async requestEmailChange(userId: string, data: RequestEmailChangeDTO) {
    return await AuthService.requestEmailChange(userId, data);
  }

  static async confirmEmailChange(userId: string, data: ConfirmEmailChangeDTO) {
    return await AuthService.confirmEmailChange(userId, data);
  }
}