import bcrypt from "bcrypt";
import { IsNull } from "typeorm";
import { AppDataSource } from "../../database/data-source";
import { User, UserRole } from "../../database/entities/User";
import { OrganizerProfile, OrganizerVerificationStatus } from "../../database/entities/OrganizerProfile";
import { VerificationToken, VerificationTokenPurpose } from "../../database/entities/VerificationToken";
import { signAccessToken, signRefreshToken } from "../../lib/jwt";
import { CustomAppError } from "../../lib/errors/customAppError";
import { ErrorCodes } from "../../lib/errors/errorCodes";
import { LoginDTO, ChangePasswordDTO, RequestPasswordResetDTO, ResetPasswordDTO } from "@/types/auth.type";
import { AuthSanitizer } from "./auth.sanitizer";
import {
  validateRegister,
  validateVerifyEmailOTP,
  validateRequestEmailVerification,
  validateChangePassword,
  validateRequestPasswordReset,
  validateResetPassword,
  validateConfirmPhoneChange,
  validateRequestPhoneChange,
} from "./auth.validator";
import { EmailService } from "@/lib/email/email.service";
import { SmsService } from "@/lib/sms/sms.service";
import { generateOTP, hashOTP, compareOTP, OTP_TTL_MS } from "@/utils/otp";
import { writeAuditLog } from "@/lib/audit/writeAuditLog";
import { AuditAction, AuditEntityType } from "@/lib/audit/auditActions";

export class AuthService {
  private static async repo() {
    const db = await AppDataSource();
    return db.getRepository(User);
  }

  private static withoutSecrets(user: User) {
    const safeUser: Partial<User> = { ...user };
    delete safeUser.passwordHash;
    return safeUser;
  }

  // ── Register ───────────────────────────────────────────────────
  // Creates User (+ OrganizerProfile, atomically, if role === ORGANIZER),
  // then fires off the first verification OTP. The DB transaction and the
  // email send are deliberately separate: a transient email failure must
  // never roll back a successful registration.
  static async register(rawData: unknown, ipAddress?: string) {
    const data = AuthSanitizer.register(rawData);
    validateRegister(data);

    const email = data.email.trim().toLowerCase();
    const repo = await this.repo();

    const existingUser = await repo.findOne({ where: { email, isDeleted: false } });
    if (existingUser) {
      throw new CustomAppError("User with this email already exists", 400, ErrorCodes.RECORD_ALREADY_EXISTS.code, ErrorCodes.RECORD_ALREADY_EXISTS.label, "user_exists");
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const db = await AppDataSource();

    const { user, otp } = await db.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const profileRepo = manager.getRepository(OrganizerProfile);

      const newUser = userRepo.create({
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email,
        phone: data.phone.trim(),
        role: data.role, // already clamped to VOTER | ORGANIZER by AuthSanitizer
        passwordHash,
      });

      const savedUser = await userRepo.save(newUser);

      if (data.role === UserRole.ORGANIZER) {
        const profile = profileRepo.create({
          user: savedUser,
          verificationStatus: OrganizerVerificationStatus.NOT_STARTED,
        });
        await profileRepo.save(profile);

        await writeAuditLog(
          {
            actorUserId: savedUser.id,
            action: AuditAction.ORGANIZER_REGISTERED,
            entityType: AuditEntityType.USER,
            entityId: savedUser.id,
            ipAddress,
          },
          manager
        );
      }

      await writeAuditLog(
        {
          actorUserId: savedUser.id,
          action: AuditAction.USER_REGISTERED,
          entityType: AuditEntityType.USER,
          entityId: savedUser.id,
          ipAddress,
          metadata: { role: data.role },
        },
        manager
      );

      // Issue the first verification OTP inside the same transaction so a
      // registered user always has a valid pending OTP row — the send
      // itself happens after commit.
      const generatedOtp = generateOTP();
      const tokenRepo = manager.getRepository(VerificationToken);
      const token = tokenRepo.create({
        user: savedUser,
        purpose: VerificationTokenPurpose.EMAIL_VERIFICATION,
        tokenHash: await hashOTP(generatedOtp),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      });
      await tokenRepo.save(token);

      return { user: savedUser, otp: generatedOtp };
    });

    await EmailService.sendEmailVerificationOTP(user.email, otp);

    const accessToken = signAccessToken(user.id, user.role);
    const refreshToken = signRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
      accessToken,
      refreshToken,
    };
  }

  // ── Email verification ────────────────────────────────────────
  // Also serves as "resend" — calling this again simply invalidates any
  // prior unconsumed OTP and issues a fresh one.
  static async requestEmailVerification(data: { email: string }) {
    validateRequestEmailVerification(data);

    const email = data.email.trim().toLowerCase();
    const repo = await this.repo();
    const user = await repo.findOne({ where: { email, isDeleted: false } });

    // Never reveal whether the email exists or is already verified —
    // same non-enumeration pattern as password reset.
    if (!user || user.emailVerified) return;

    const db = await AppDataSource();
    const otp = generateOTP();

    await db.transaction(async (manager) => {
      const tokenRepo = manager.getRepository(VerificationToken);

      // Invalidate any prior unconsumed OTP for this purpose so only the
      // most recent one is ever valid.
      await tokenRepo.delete({
        user: { id: user.id },
        purpose: VerificationTokenPurpose.EMAIL_VERIFICATION,
        consumedAt: IsNull(),
      });

      const token = tokenRepo.create({
        user,
        purpose: VerificationTokenPurpose.EMAIL_VERIFICATION,
        tokenHash: await hashOTP(otp),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      });
      await tokenRepo.save(token);
    });

    await EmailService.sendEmailVerificationOTP(user.email, otp);
  }

  static async verifyEmailOTP(data: { email: string; otp: string }) {
    validateVerifyEmailOTP(data);

    const email = data.email.trim().toLowerCase();
    const db = await AppDataSource();
    const userRepo = db.getRepository(User);
    const tokenRepo = db.getRepository(VerificationToken);

    const user = await userRepo.findOne({ where: { email, isDeleted: false } });
    if (!user) {
      throw new CustomAppError("Invalid or expired code", 400, ErrorCodes.INVALID_OTP.code, ErrorCodes.INVALID_OTP.label, "invalid_otp");
    }

    if (user.emailVerified) {
      return this.withoutSecrets(user);
    }

    const token = await tokenRepo.findOne({
      where: {
        user: { id: user.id },
        purpose: VerificationTokenPurpose.EMAIL_VERIFICATION,
        consumedAt: IsNull(),
      },
      order: { createdAt: "DESC" },
    });

    if (!token || token.expiresAt < new Date()) {
      throw new CustomAppError("Invalid or expired code", 400, ErrorCodes.INVALID_OTP.code, ErrorCodes.INVALID_OTP.label, "invalid_otp");
    }

    const valid = await compareOTP(data.otp.trim(), token.tokenHash);
    if (!valid) {
      throw new CustomAppError("Invalid or expired code", 400, ErrorCodes.INVALID_OTP.code, ErrorCodes.INVALID_OTP.label, "invalid_otp");
    }

    await db.transaction(async (manager) => {
      await manager.update(VerificationToken, token.id, { consumedAt: new Date() });
      await manager.update(User, user.id, { emailVerified: true });
      await writeAuditLog(
        {
          actorUserId: user.id,
          action: AuditAction.EMAIL_VERIFIED,
          entityType: AuditEntityType.USER,
          entityId: user.id,
        },
        manager
      );
    });

    await EmailService.sendEmailVerifiedConfirmation(user.email);

    return this.withoutSecrets({ ...user, emailVerified: true });
  }

  // ── Phone verification ────────────────────────────────────────
  // Authenticated (unlike email verification) — User.phone has no unique
  // constraint, so looking it up by raw phone number the way email
  // verification does would be ambiguous if two accounts share a number.
  // Scoping to the authenticated user (req.user.sub) sidesteps that
  // entirely and also means this can't be used to spam OTPs to arbitrary
  // phone numbers you don't own.
  static async requestPhoneVerification(userId: string) {
    const repo = await this.repo();
    const user = await repo.findOne({ where: { id: userId, isDeleted: false } });

    if (!user) {
      throw new CustomAppError("User not found", 404, ErrorCodes.USER_NOT_FOUND.code, ErrorCodes.USER_NOT_FOUND.label, "user_not_found");
    }
    if (!user.phone?.trim()) {
      throw new CustomAppError("Add a phone number to your account before verifying it", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "phone_missing");
    }
    if (user.phoneVerified) {
      return this.withoutSecrets(user);
    }

    const db = await AppDataSource();
    const otp = generateOTP();

    await db.transaction(async (manager) => {
      const tokenRepo = manager.getRepository(VerificationToken);

      await tokenRepo.delete({
        user: { id: user.id },
        purpose: VerificationTokenPurpose.PHONE_VERIFICATION,
        consumedAt: IsNull(),
      });

      const token = tokenRepo.create({
        user,
        purpose: VerificationTokenPurpose.PHONE_VERIFICATION,
        tokenHash: await hashOTP(otp),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      });
      await tokenRepo.save(token);
    });

    await SmsService.sendPhoneVerificationOTP(user.phone, otp);

    return this.withoutSecrets(user);
  }

  static async verifyPhoneOTP(userId: string, otp: string) {
    if (!otp?.trim() || !/^\d{6}$/.test(otp.trim())) {
      throw new CustomAppError("otp must be a 6-digit code", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed");
    }

    const db = await AppDataSource();
    const userRepo = db.getRepository(User);
    const tokenRepo = db.getRepository(VerificationToken);

    const user = await userRepo.findOne({ where: { id: userId, isDeleted: false } });
    if (!user) {
      throw new CustomAppError("User not found", 404, ErrorCodes.USER_NOT_FOUND.code, ErrorCodes.USER_NOT_FOUND.label, "user_not_found");
    }
    if (user.phoneVerified) {
      return this.withoutSecrets(user);
    }

    const token = await tokenRepo.findOne({
      where: {
        user: { id: user.id },
        purpose: VerificationTokenPurpose.PHONE_VERIFICATION,
        consumedAt: IsNull(),
      },
      order: { createdAt: "DESC" },
    });

    if (!token || token.expiresAt < new Date()) {
      throw new CustomAppError("Invalid or expired code", 400, ErrorCodes.INVALID_OTP.code, ErrorCodes.INVALID_OTP.label, "invalid_otp");
    }

    const valid = await compareOTP(otp.trim(), token.tokenHash);
    if (!valid) {
      throw new CustomAppError("Invalid or expired code", 400, ErrorCodes.INVALID_OTP.code, ErrorCodes.INVALID_OTP.label, "invalid_otp");
    }

    await db.transaction(async (manager) => {
      await manager.update(VerificationToken, token.id, { consumedAt: new Date() });
      await manager.update(User, user.id, { phoneVerified: true });
      await writeAuditLog(
        {
          actorUserId: user.id,
          action: AuditAction.PHONE_VERIFIED,
          entityType: AuditEntityType.USER,
          entityId: user.id,
        },
        manager
      );
    });

    return this.withoutSecrets({ ...user, phoneVerified: true });
  }

    // ── Change phone number (verified users only) ───────────────────
  // The only way a verified phone can ever change — see the block added
  // in UserService.update. `phone`/`phoneVerified` are never touched at
  // request time; only `pendingPhone` is set here, so there's no window
  // where an unconfirmed number looks verified.
  static async requestPhoneChange(userId: string, data: { newPhone: string }) {
    validateRequestPhoneChange(data);

    const repo = await this.repo();
    const user = await repo.findOne({ where: { id: userId, isDeleted: false } });
    if (!user) {
      throw new CustomAppError("User not found", 404, ErrorCodes.USER_NOT_FOUND.code, ErrorCodes.USER_NOT_FOUND.label, "user_not_found");
    }

    const newPhone = data.newPhone.trim();
    if (newPhone === user.phone) {
      throw new CustomAppError("This is already your current phone number", 400, ErrorCodes.VALIDATION_FAILED.code, ErrorCodes.VALIDATION_FAILED.label, "validation_failed");
    }

    const db = await AppDataSource();
    const otp = generateOTP();

    await db.transaction(async (manager) => {
      const tokenRepo = manager.getRepository(VerificationToken);

      await tokenRepo.delete({
        user: { id: user.id },
        purpose: VerificationTokenPurpose.PHONE_VERIFICATION,
        consumedAt: IsNull(),
      });

      const token = tokenRepo.create({
        user,
        purpose: VerificationTokenPurpose.PHONE_VERIFICATION,
        tokenHash: await hashOTP(otp),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      });
      await tokenRepo.save(token);

      await manager.update(User, user.id, { pendingPhone: newPhone });

      await writeAuditLog(
        {
          actorUserId: user.id,
          action: AuditAction.PHONE_CHANGE_REQUESTED,
          entityType: AuditEntityType.USER,
          entityId: user.id,
          metadata: { newPhone },
        },
        manager
      );
    });

    await SmsService.sendPhoneVerificationOTP(newPhone, otp);

    return this.withoutSecrets({ ...user, pendingPhone: newPhone });
  }

  static async confirmPhoneChange(userId: string, data: { otp: string }) {
    validateConfirmPhoneChange(data);

    const db = await AppDataSource();
    const userRepo = db.getRepository(User);
    const tokenRepo = db.getRepository(VerificationToken);

    const user = await userRepo.findOne({ where: { id: userId, isDeleted: false } });
    if (!user) {
      throw new CustomAppError("User not found", 404, ErrorCodes.USER_NOT_FOUND.code, ErrorCodes.USER_NOT_FOUND.label, "user_not_found");
    }
    if (!user.pendingPhone) {
      throw new CustomAppError("No phone change is currently pending", 400, ErrorCodes.INVALID_STATE.code, ErrorCodes.INVALID_STATE.label, "no_pending_phone_change");
    }

    const token = await tokenRepo.findOne({
      where: {
        user: { id: user.id },
        purpose: VerificationTokenPurpose.PHONE_VERIFICATION,
        consumedAt: IsNull(),
      },
      order: { createdAt: "DESC" },
    });

    if (!token || token.expiresAt < new Date()) {
      throw new CustomAppError("Invalid or expired code", 400, ErrorCodes.INVALID_OTP.code, ErrorCodes.INVALID_OTP.label, "invalid_otp");
    }

    const valid = await compareOTP(data.otp.trim(), token.tokenHash);
    if (!valid) {
      throw new CustomAppError("Invalid or expired code", 400, ErrorCodes.INVALID_OTP.code, ErrorCodes.INVALID_OTP.label, "invalid_otp");
    }

    const newPhone = user.pendingPhone;

    await db.transaction(async (manager) => {
      await manager.update(VerificationToken, token.id, { consumedAt: new Date() });
      await manager.update(User, user.id, { phone: newPhone, phoneVerified: true, pendingPhone: null as unknown as string });
      await writeAuditLog(
        {
          actorUserId: user.id,
          action: AuditAction.PHONE_CHANGE_CONFIRMED,
          entityType: AuditEntityType.USER,
          entityId: user.id,
          metadata: { newPhone },
        },
        manager
      );
    });

    await EmailService.sendPhoneChanged(user.email, newPhone);

    return this.withoutSecrets({ ...user, phone: newPhone, phoneVerified: true, pendingPhone: undefined as unknown as string });
  }

  // (admin use only) Marks the email as verified without an OTP — e.g. for
  // support cases where a user genuinely never receives mail. Must only be
  // reachable via an admin-authorized route; this method itself does not
  // check the caller's role.
  static async adminVerifyEmail(userId: string, adminId: string) {
    const repo = await this.repo();
    const user = await repo.findOne({ where: { id: userId, isDeleted: false } });
    if (!user) {
      throw new CustomAppError("No user found with the given ID", 404, ErrorCodes.USER_NOT_FOUND.code, ErrorCodes.USER_NOT_FOUND.label, "user_not_found");
    }

    if (user.emailVerified) return this.withoutSecrets(user);

    await repo.update(userId, { emailVerified: true });
    await writeAuditLog({
      actorUserId: adminId,
      action: AuditAction.EMAIL_VERIFIED_BY_ADMIN,
      entityType: AuditEntityType.USER,
      entityId: userId,
    });

    return this.withoutSecrets({ ...user, emailVerified: true });
  }

  // ── Password ─────────────────────────────────────────────────────
  // NOTE on session revocation: this codebase's refresh tokens are
  // stateless signed JWTs with no server-side revocation list (no
  // refreshTokenHash column, no session table). Changing/resetting a
  // password here does NOT invalidate any refresh token already issued —
  // it will keep working until it expires. That's a pre-existing
  // architectural gap, not something silently introduced here; flagging
  // it rather than pretending a "revoke sessions" step exists when there's
  // no mechanism for it yet. If you want real revocation, that needs a
  // server-side allow/deny-list for refresh tokens, which is a separate
  // piece of work from this password flow.

  static async changePassword(userId: string, data: ChangePasswordDTO) {
    validateChangePassword(data);

    const repo = await this.repo();
    const user = await repo.findOne({ where: { id: userId, isDeleted: false } });
    if (!user) {
      throw new CustomAppError("User not found", 404, ErrorCodes.USER_NOT_FOUND.code, ErrorCodes.USER_NOT_FOUND.label, "user_not_found");
    }

    const valid = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!valid) {
      throw new CustomAppError("Current password is incorrect", 401, ErrorCodes.INVALID_CREDENTIALS.code, ErrorCodes.INVALID_CREDENTIALS.label, "invalid_current_password");
    }

    const same = await bcrypt.compare(data.newPassword, user.passwordHash);
    if (same) {
      throw new CustomAppError("New password must be different from your current password", 400, ErrorCodes.INVALID_STATE.code, ErrorCodes.INVALID_STATE.label, "same_password");
    }

    const newHash = await bcrypt.hash(data.newPassword, 10);
    await repo.update(userId, { passwordHash: newHash });

    await writeAuditLog({
      actorUserId: userId,
      action: AuditAction.PASSWORD_CHANGED,
      entityType: AuditEntityType.USER,
      entityId: userId,
    });

    await EmailService.sendPasswordChanged(user.email);

    return this.withoutSecrets({ ...user, passwordHash: newHash });
  }

  // Public, unauthenticated — the "forgot password" entry point. Same
  // non-enumeration pattern as requestEmailVerification: never reveal
  // whether the email exists.
  static async requestPasswordReset(data: RequestPasswordResetDTO) {
    validateRequestPasswordReset(data);

    const email = data.email.trim().toLowerCase();
    const repo = await this.repo();
    const user = await repo.findOne({ where: { email, isDeleted: false } });

    if (!user) return;

    const db = await AppDataSource();
    const otp = generateOTP();

    await db.transaction(async (manager) => {
      const tokenRepo = manager.getRepository(VerificationToken);

      await tokenRepo.delete({
        user: { id: user.id },
        purpose: VerificationTokenPurpose.PASSWORD_RESET,
        consumedAt: IsNull(),
      });

      const token = tokenRepo.create({
        user,
        purpose: VerificationTokenPurpose.PASSWORD_RESET,
        tokenHash: await hashOTP(otp),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      });
      await tokenRepo.save(token);
    });

    await EmailService.sendPasswordResetOTP(user.email, otp);
  }

  static async resetPassword(data: ResetPasswordDTO) {
    validateResetPassword(data);

    const email = data.email.trim().toLowerCase();
    const db = await AppDataSource();
    const userRepo = db.getRepository(User);
    const tokenRepo = db.getRepository(VerificationToken);

    const user = await userRepo.findOne({ where: { email, isDeleted: false } });
    if (!user) {
      throw new CustomAppError("Invalid or expired code", 400, ErrorCodes.INVALID_OTP.code, ErrorCodes.INVALID_OTP.label, "invalid_otp");
    }

    const token = await tokenRepo.findOne({
      where: {
        user: { id: user.id },
        purpose: VerificationTokenPurpose.PASSWORD_RESET,
        consumedAt: IsNull(),
      },
      order: { createdAt: "DESC" },
    });

    if (!token || token.expiresAt < new Date()) {
      throw new CustomAppError("Invalid or expired code", 400, ErrorCodes.INVALID_OTP.code, ErrorCodes.INVALID_OTP.label, "invalid_otp");
    }

    const valid = await compareOTP(data.otp.trim(), token.tokenHash);
    if (!valid) {
      throw new CustomAppError("Invalid or expired code", 400, ErrorCodes.INVALID_OTP.code, ErrorCodes.INVALID_OTP.label, "invalid_otp");
    }

    const same = await bcrypt.compare(data.newPassword, user.passwordHash);
    if (same) {
      throw new CustomAppError("New password must be different from your current password", 400, ErrorCodes.INVALID_STATE.code, ErrorCodes.INVALID_STATE.label, "same_password");
    }

    const newHash = await bcrypt.hash(data.newPassword, 10);

    await db.transaction(async (manager) => {
      await manager.update(VerificationToken, token.id, { consumedAt: new Date() });
      await manager.update(User, user.id, { passwordHash: newHash });
      await writeAuditLog(
        {
          actorUserId: user.id,
          action: AuditAction.PASSWORD_RESET,
          entityType: AuditEntityType.USER,
          entityId: user.id,
        },
        manager
      );
    });

    await EmailService.sendPasswordChanged(user.email);
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
      throw new CustomAppError( "Invalid email or password", 401, ErrorCodes.INVALID_CREDENTIALS.code, ErrorCodes.INVALID_CREDENTIALS.label, "unauthorized" );
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
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
      },
      accessToken,
      refreshToken,
    };
  }
}