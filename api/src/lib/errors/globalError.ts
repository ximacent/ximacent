import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { QueryFailedError } from "typeorm";
import { CustomAppError } from "./customAppError";
import { ErrorCodes } from "./errorCodes";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, message, ...(details ? { details } : {}) },
    { status }
  );
}

export function handleError(err: unknown): NextResponse {
  // Always log server-side, regardless of environment.
  console.error(err);

  if (err instanceof ZodError) {
    return fail("Validation error", 422, err.flatten().fieldErrors);
  }

  if (err instanceof CustomAppError) {
    return NextResponse.json(
      {
        success: false,
        message: err.message,
        code: err.errorCode,
        label: err.errorLabel,
        key: err.errorKey,
      },
      { status: err.statusCode }
    );
  }

  // Must come before the generic `Error` check below, since
  // QueryFailedError extends Error.
  if (err instanceof QueryFailedError) {
    const pgErr = err as QueryFailedError & { code?: string; detail?: string };

    switch (pgErr.code) {
      case "23505": // unique_violation
        return fail("A record with this value already exists", 409, pgErr.detail);
      case "23503": // foreign_key_violation
        return fail("Related record not found", 409, pgErr.detail);
      case "23502": // not_null_violation
        return fail("A required field is missing", 400, pgErr.detail);
      default:
        return fail("Database error", 500);
    }
  }

  if (err instanceof Error) {
    const [code, meta] = err.message.split(":");
    switch (code) {
      case "INVALID_CREDENTIALS":   return fail("Invalid email or password", 401);
      case "ACCOUNT_LOCKED":        return fail(`Account locked. Try again in ${meta} minutes`, 423);
      case "ACCOUNT_INACTIVE":      return fail("Account is inactive or deleted", 403);
      case "INVALID_REFRESH_TOKEN": return fail("Session expired, please log in again", 401);
      case "REFRESH_TOKEN_REUSE":   return fail("Security alert: all sessions have been revoked", 401);
      case "WRONG_TOKEN_TYPE":
      case "JsonWebTokenError":
      case "TokenExpiredError":     return fail("Invalid or expired token", 401);
      case "USER_NOT_FOUND":        return fail("User not found", 404);
      case "INVALID_RESET_TOKEN":   return fail("Invalid or expired reset link", 400);
      case "SAME_PASSWORD":         return fail("New password must be different", 400);
      case "2FA_ALREADY_ENABLED":   return fail("2FA is already enabled", 400);
      case "2FA_NOT_ENABLED":       return fail("2FA is not enabled", 400);
      case "INVALID_OTP":           return fail("Invalid or expired OTP code", 401);
      case "INVALID_BACKUP_CODE":   return fail("Invalid backup code", 401);
      default:                      return fail("Internal server error", 500);
    }
  }

  return fail("Internal server error", 500);
}