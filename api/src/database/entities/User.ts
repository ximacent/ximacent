import { Entity, Column, OneToMany, OneToOne, type Relation } from "typeorm";
import { AppBaseEntity } from "./BaseEntity";
import { Election } from "./Election";
import { Payment } from "./Payment";
import { AuditLog } from "./AuditLog";
import { OrganizerProfile } from "./OrganizerProfile";

export enum UserRole {
  ADMIN = "admin",
  VOTER = "voter",
  ORGANIZER = "organizer",
  SUPER_ADMIN = "super_admin",
}

@Entity("users")
export class User extends AppBaseEntity {
  @Column({type: "varchar", length: 255, nullable: false})
  firstName!: string;

  @Column({type: "varchar", length: 255, nullable: false})
  lastName!: string;

  @Column({ unique: true, length: 255, nullable: false })
  email!: string;

  @Column({ name: "password_hash", nullable: false })
  passwordHash!: string;

  @Column({ type: "varchar", length: 20, nullable: false })
  phone?: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.VOTER })
  role!: UserRole;

  @Column({ name: "is_verified", default: false })
  isVerified!: boolean;

  // Tracks email ownership verification (OTP-based). Deliberately separate
  // from `isVerified` above (legacy/unused field, left untouched) and from
  // OrganizerProfile.verificationStatus — email verification and organizer
  // approval are two independent gates. See OrganizerProfile for the latter.
  @Column({ name: "email_verified", default: false })
  emailVerified!: boolean;

  // Same idea as emailVerified, but for phone — a stronger identity signal
  // than email alone (used as a gate on organizer submission alongside it).
  @Column({ name: "phone_verified", default: false })
  phoneVerified!: boolean;

  // Holds a new phone number awaiting OTP confirmation. Once `phone` is
  // verified, it can no longer be changed directly via the normal
  // profile-update endpoint (see UserService.update) — a change must go
  // through request-phone-change -> confirm-phone-change, and `phone`
  // itself only gets overwritten once the OTP sent to THIS number is
  // confirmed. Until then, the real `phone`/`phoneVerified` stay
  // untouched, so there's never a window where the account shows an
  // unverified number.
  @Column({ name: "pending_phone", type: "varchar", length: 20, nullable: true })
  pendingPhone?: string;

  // Same idea as pendingPhone, but for email — the login credential, so
  // uniqueness is checked at request time (and race-guarded again at
  // confirm time, in case someone else claims the same email in between).
  // Unlike phone, there is no "freely editable before first verification"
  // exception here — email has never been changeable through the plain
  // profile-update endpoint at all, so this flow is the only way, period.
  @Column({ name: "pending_email", type: "varchar", length: 255, nullable: true })
  pendingEmail?: string;

  @OneToMany(() => Election, (election) => election.createdBy)
  elections!: Relation<Election[]>;

  @OneToMany(() => Payment, (payment) => payment.user)
  payments!: Relation<Payment[]>;

  @OneToMany(() => AuditLog, (log) => log.actor)
  auditLogs!: Relation<AuditLog[]>;

  @OneToOne(() => OrganizerProfile, (profile) => profile.user)
  organizerProfile?: Relation<OrganizerProfile>;
}