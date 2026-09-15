import { Entity, Column, ManyToOne, JoinColumn, PrimaryGeneratedColumn, CreateDateColumn, type Relation } from "typeorm";
import { User } from "./User";

// Shared table for any OTP/token issued to a user for a specific purpose.
// EMAIL_VERIFICATION is implemented now; PASSWORD_RESET is reserved so a
// future password-reset feature needs new service functions only, not a
// new migration.
export enum VerificationTokenPurpose {
  EMAIL_VERIFICATION = "email_verification",
  PHONE_VERIFICATION = "phone_verification",
  PASSWORD_RESET = "password_reset",
}

@Entity("verification_tokens")
export class VerificationToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: Relation<User>;

  @Column({ type: "enum", enum: VerificationTokenPurpose })
  purpose!: VerificationTokenPurpose;

  // Never store the raw OTP — only its hash, same pattern as passwordHash.
  @Column({ name: "token_hash", type: "varchar", nullable: false })
  tokenHash!: string;

  @Column({ name: "expires_at", type: "timestamptz", nullable: false })
  expiresAt!: Date;

  @Column({ name: "consumed_at", type: "timestamptz", nullable: true })
  consumedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
