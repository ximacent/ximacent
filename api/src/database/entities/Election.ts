import { Entity, Column, ManyToOne, OneToMany, JoinColumn, type Relation } from "typeorm";
import { AppBaseEntity } from "./BaseEntity";
import { User } from "./User";
import { Category } from "./Category";

export enum ElectionStatus {
  DRAFT = "draft",                   // organizer editing, not yet submitted
  PENDING_REVIEW = "pending_review",  // organizer submitted, awaiting admin review
  APPROVED = "approved",              // admin approved, not yet launched
  REJECTED = "rejected",              // admin rejected — organizer edits and resubmits
  ACTIVE = "active",                  // launched, live voting
  CLOSED = "closed",
}

@Entity("elections")
export class Election extends AppBaseEntity {
  @Column({ type: "varchar", length: 255, unique: true, nullable: false })
  title!: string;

  @Column({ type: "varchar", length: 20, unique: true, nullable: true })
  alias!: string //Alternative name, short name, handle 

  @Column({ type: "varchar", unique: true, length: 255, nullable: false })
  slug!: string //URL-friendly identifier, e.g, "tech-conference-2024", "music-festival", "local-election"

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ name: "start_date", type: "timestamptz" })
  startDate!: Date;

  @Column({ name: "end_date", type: "timestamptz" })
  endDate!: Date;

  @Column({ name: "price_per_vote", type: "decimal", precision: 10, scale: 2, nullable: false })
  pricePerVote!: string;

  @Column({ type: "enum", enum: ElectionStatus, default: ElectionStatus.DRAFT })
  status!: ElectionStatus;

  @Column({ name: "banner_url", nullable: true })
  bannerUrl?: string;

  // Populated only when status = REJECTED, mirroring OrganizerProfile's
  // rejectionReason — an organizer needs to know what to fix before
  // resubmitting.
  @Column({ name: "rejection_reason", type: "text", nullable: true })
  rejectionReason?: string;

  @ManyToOne(() => User, (user) => user.elections, { nullable: false, onDelete: "RESTRICT" })
  @JoinColumn({ name: "created_by" })
  createdBy?: Relation<User>;

  @OneToMany(() => Category, (category) => category.election)
  categories!: Relation<Category[]>;
}