import { Entity, Column, OneToMany, type Relation } from "typeorm";
import { AppBaseEntity } from "./BaseEntity";
import { Election } from "./Election";
import { Payment } from "./Payment";
import { AuditLog } from "./AuditLog";

export enum UserRole {
  ADMIN = "admin",
  VOTER = "voter",
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

  @Column({ type: "varchar", length: 20, nullable: true })
  phone?: string;

  @Column({ type: "enum", enum: UserRole, default: UserRole.VOTER })
  role!: UserRole;

  @Column({ name: "is_verified", default: false })
  isVerified!: boolean;

  @OneToMany(() => Election, (election) => election.createdBy)
  elections!: Relation<Election[]>;

  @OneToMany(() => Payment, (payment) => payment.user)
  payments!: Relation<Payment[]>;

  @OneToMany(() => AuditLog, (log) => log.actor)
  auditLogs!: Relation<AuditLog[]>;
}