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

  @OneToMany(() => Election, (election) => election.createdBy)
  elections!: Relation<Election[]>;

  @OneToMany(() => Payment, (payment) => payment.user)
  payments!: Relation<Payment[]>;

  @OneToMany(() => AuditLog, (log) => log.actor)
  auditLogs!: Relation<AuditLog[]>;

  @OneToOne(() => OrganizerProfile, (profile) => profile.user)
  organizerProfile?: Relation<OrganizerProfile>;
}