import type { UserRole } from "@/database/entities/User";

// ── Login ───────────────────────────────────────────────────────
export type LoginDTO = {
  email: string;
  password: string;
};

// ── Register ────────────────────────────────────────────────────
// `role` is intentionally restricted at the sanitizer/validator layer to
// VOTER | ORGANIZER — this DTO shape alone does not guarantee that; never
// trust it without going through RegisterSanitizer first.
export type RegisterDTO = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  role: UserRole;
};

// ── Email verification ─────────────────────────────────────────
export type RequestEmailVerificationDTO = {
  email: string;
};

export type VerifyEmailOTPDTO = {
  email: string;
  otp: string;
};

// ── Password ───────────────────────────────────────────────────
export type ChangePasswordDTO = {
  currentPassword: string;
  newPassword: string;
};

export type RequestPasswordResetDTO = {
  email: string;
};

export type ResetPasswordDTO = {
  email: string;
  otp: string;
  newPassword: string;
};

// ── Phone change ───────────────────────────────────────────────
export type RequestPhoneChangeDTO = {
  newPhone: string;
};

export type ConfirmPhoneChangeDTO = {
  otp: string;
};

// ── Email change ───────────────────────────────────────────────
export type RequestEmailChangeDTO = {
  newEmail: string;
};

export type ConfirmEmailChangeDTO = {
  otp: string;
};