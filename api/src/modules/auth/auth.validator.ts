import { CustomAppError } from "@/lib/errors/customAppError";
import { ErrorCodes } from "@/lib/errors/errorCodes";
import { RegisterDTO, RequestEmailVerificationDTO, VerifyEmailOTPDTO, ChangePasswordDTO, RequestPasswordResetDTO, ResetPasswordDTO, RequestPhoneChangeDTO, ConfirmPhoneChangeDTO, ConfirmEmailChangeDTO, RequestEmailChangeDTO } from "@/types/auth.type";

function fail(message: string): never {
  throw new CustomAppError(message, 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed");
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateRegister(data: RegisterDTO) {
  if (!data.firstName?.trim()) fail("firstName is required");
  if (!data.lastName?.trim()) fail("lastName is required");
  if (!data.email?.trim()) fail("email is required");
  if (!EMAIL_REGEX.test(data.email.trim())) fail("email must be a valid email address");
  if (!data.phone?.trim()) fail("phone is required");
  if (!data.password) fail("password is required");

  validatePasswordStrength(data.password);
}

export function validatePasswordStrength(password: string) {
  const specialCharsRegex = /[!@#$%^&*(),.?":{}|<>]/;
  const numberRegex = /\d/;

  if (!password) fail("Password is required");
  if (password.length < 8) fail("Password must be at least 8 characters long.");
  if (!numberRegex.test(password)) fail("Password must contain at least one number.");
  if (!specialCharsRegex.test(password)) fail("Password must contain at least one special character.");
}

export function validateRequestEmailVerification(data: RequestEmailVerificationDTO) {
  if (!data.email?.trim()) fail("email is required");
}

export function validateVerifyEmailOTP(data: VerifyEmailOTPDTO) {
  if (!data.email?.trim()) fail("email is required");
  if (!data.otp?.trim()) fail("otp is required");
  if (!/^\d{6}$/.test(data.otp.trim())) fail("otp must be a 6-digit code");
}

export function validateChangePassword(data: ChangePasswordDTO) {
  if (!data.currentPassword) fail("currentPassword is required");
  if (!data.newPassword) fail("newPassword is required");
  validatePasswordStrength(data.newPassword);
}

export function validateRequestPasswordReset(data: RequestPasswordResetDTO) {
  if (!data.email?.trim()) fail("email is required");
}

export function validateResetPassword(data: ResetPasswordDTO) {
  if (!data.email?.trim()) fail("email is required");
  if (!data.otp?.trim()) fail("otp is required");
  if (!/^\d{6}$/.test(data.otp.trim())) fail("otp must be a 6-digit code");
  if (!data.newPassword) fail("newPassword is required");
  validatePasswordStrength(data.newPassword);
}

export function validateRequestPhoneChange(data: RequestPhoneChangeDTO) {
  if (!data.newPhone?.trim()) fail("newPhone is required");
}

export function validateConfirmPhoneChange(data: ConfirmPhoneChangeDTO) {
  if (!data.otp?.trim()) fail("otp is required");
  if (!/^\d{6}$/.test(data.otp.trim())) fail("otp must be a 6-digit code");
}

export function validateRequestEmailChange(data: RequestEmailChangeDTO) {
  if (!data.newEmail?.trim()) fail("newEmail is required");
  if (!EMAIL_REGEX.test(data.newEmail.trim())) fail("newEmail must be a valid email address");
}

export function validateConfirmEmailChange(data: ConfirmEmailChangeDTO) {
  if (!data.otp?.trim()) fail("otp is required");
  if (!/^\d{6}$/.test(data.otp.trim())) fail("otp must be a 6-digit code");
}