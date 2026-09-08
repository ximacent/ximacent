import { Entity, Column, ManyToOne, OneToMany, JoinColumn, type Relation } from "typeorm";
import { AppBaseEntity } from "./BaseEntity";
import { User } from "./User";
import { Nominee } from "./Nominee";
import { Vote } from "./Vote";

export enum PaymentStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
}

@Entity("payments")
export class Payment extends AppBaseEntity {
  @ManyToOne(() => User, (user) => user.payments, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user?: Relation<User>;

  @ManyToOne(() => Nominee, { nullable: false })
  @JoinColumn({ name: "nominee_id" })
  nominee!: Relation<Nominee>;

  @Column({ default: "paystack", type: "varchar", length: 50, nullable: false })
  provider!: string;

  @Column({ name: "provider_reference", unique: true, type: "varchar", length: 255, nullable: false })
  providerReference!: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  amount!: string;

  @Column({ default: "GHS" })
  currency!: string;

  @Column({ type: "enum", enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ type: "int", default: 1 })
  quantity!: number;

  // Optional — never required from the voter. Used for receipts/contact if given.
  @Column({ name: "voter_email", type: "varchar", length: 255, nullable: true })
  voterEmail?: string;

  @Column({ name: "voter_phone", type: "varchar", length: 30, nullable: true })
  voterPhone?: string;

  @OneToMany(() => Vote, (vote) => vote.payment)
  votes!: Relation<Vote[]>;
}