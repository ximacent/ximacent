import { Entity, Column, OneToOne, ManyToOne, JoinColumn, type Relation } from "typeorm";
import { AppBaseEntity } from "./BaseEntity";
import { User } from "./User";

// State machine for organizer verification. Deliberately not a boolean —
// see OrganizerService for the allowed transitions between these states.
export enum OrganizerVerificationStatus {
  NOT_STARTED = "not_started", // registered as ORGANIZER, profile not yet completed/submitted
  PENDING = "pending",         // profile submitted, awaiting admin review
  APPROVED = "approved",       // admin approved — can create elections
  REJECTED = "rejected",       // admin rejected — can edit + resubmit
  SUSPENDED = "suspended",     // admin suspended an approved organizer
}

export enum OrganizationType {
  INDIVIDUAL = "individual",
  COMPANY = "company",
  NGO = "ngo",
  SCHOOL = "school",
  CHURCH = "church",
  GOVERNMENT = "government",
  OTHER = "other",
}

@Entity("organizer_profiles")
export class OrganizerProfile extends AppBaseEntity {
  // One organizer profile per user. Ownership is always resolved through
  // this relation (or the JWT's `sub`) — never trust a client-supplied
  // userId when reading/writing a profile.
  @OneToOne(() => User, (user) => user.organizerProfile, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: Relation<User>;

  @Column({ name: "organization_name", type: "varchar", length: 255, nullable: true })
  organizationName?: string;

  @Column({ name: "organization_type", type: "enum", enum: OrganizationType, nullable: true })
  organizationType?: OrganizationType;

  // Ghana-only for now — region/city instead of a full country field.
  // Revisit if the platform expands beyond Ghana.
  @Column({ type: "varchar", length: 100, nullable: true })
  region?: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  city?: string;

  // Organization's own contact number — distinct from User.phone (the
  // registrant's personal number, collected at registration). Optional:
  // many organizers will just reuse their personal number, so this isn't
  // required to submit an application.
  @Column({ name: "organization_phone", type: "varchar", length: 20, nullable: true })
  organizationPhone?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  website?: string;

  @Column({ name: "social_media_url", type: "varchar", length: 255, nullable: true })
  socialMediaUrl?: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  // Ghana Card (NIA) details. Both required at submission (per the current
  // business decision, since a registered-business number isn't a fair
  // requirement — not every organizer has one). ghCardNumber is stored so
  // it can later be checked against a real NIA verification API once
  // that integration exists; for now it's a manual-review field alongside
  // the image, which the admin eyeballs during review. Unique (when
  // present) so the same ID can't back multiple organizer accounts.
  @Column({ name: "gh_card_number", type: "varchar", length: 50, nullable: true, unique: true })
  ghCardNumber?: string;

  @Column({ name: "gh_card_image_url", type: "varchar", length: 500, nullable: true })
  ghCardImageUrl?: string;

  @Column({
    name: "verification_status",
    type: "enum",
    enum: OrganizerVerificationStatus,
    default: OrganizerVerificationStatus.NOT_STARTED,
  })
  verificationStatus!: OrganizerVerificationStatus;

  @Column({ name: "submitted_at", type: "timestamptz", nullable: true })
  submittedAt?: Date;

  @Column({ name: "reviewed_at", type: "timestamptz", nullable: true })
  reviewedAt?: Date;

  // Nullable + SET NULL on delete: if the reviewing admin account is later
  // deleted, the organizer's approval record must survive — we lose "who"
  // but keep the fact that a review happened (reviewedAt, verificationStatus).
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "reviewed_by" })
  reviewedBy?: Relation<User>;

  @Column({ name: "rejection_reason", type: "text", nullable: true })
  rejectionReason?: string;
}
