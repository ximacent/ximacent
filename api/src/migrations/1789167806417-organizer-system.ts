import { MigrationInterface, QueryRunner } from "typeorm";

export class OrganizerSystem1789167806417 implements MigrationInterface {
    name = 'OrganizerSystem1789167806417'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ── users: ORGANIZER role + emailVerified ──────────────────────
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" ADD VALUE 'organizer'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_verified" boolean NOT NULL DEFAULT false`);

        // ── organizer_profiles ──────────────────────────────────────────
        await queryRunner.query(`CREATE TYPE "public"."organizer_profiles_organization_type_enum" AS ENUM('individual', 'company', 'ngo', 'school', 'church', 'government', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."organizer_profiles_verification_status_enum" AS ENUM('not_started', 'pending', 'approved', 'rejected', 'suspended')`);
        await queryRunner.query(`CREATE TABLE "organizer_profiles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isDeleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "organization_name" character varying(255), "organization_type" "public"."organizer_profiles_organization_type_enum", "region" character varying(100), "city" character varying(100), "phone" character varying(20), "website" character varying(255), "social_media_url" character varying(255), "description" text, "verification_status" "public"."organizer_profiles_verification_status_enum" NOT NULL DEFAULT 'not_started', "submitted_at" TIMESTAMP WITH TIME ZONE, "reviewed_at" TIMESTAMP WITH TIME ZONE, "rejection_reason" text, "user_id" uuid NOT NULL, "reviewed_by" uuid, CONSTRAINT "UQ_organizer_profiles_user_id" UNIQUE ("user_id"), CONSTRAINT "PK_organizer_profiles_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "organizer_profiles" ADD CONSTRAINT "FK_organizer_profiles_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organizer_profiles" ADD CONSTRAINT "FK_organizer_profiles_reviewed_by" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "IDX_organizer_profiles_verification_status" ON "organizer_profiles" ("verification_status")`);

        // ── verification_tokens ─────────────────────────────────────────
        await queryRunner.query(`CREATE TYPE "public"."verification_tokens_purpose_enum" AS ENUM('email_verification', 'password_reset')`);
        await queryRunner.query(`CREATE TABLE "verification_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "purpose" "public"."verification_tokens_purpose_enum" NOT NULL, "token_hash" character varying NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "consumed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, CONSTRAINT "PK_verification_tokens_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "verification_tokens" ADD CONSTRAINT "FK_verification_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`CREATE INDEX "IDX_verification_tokens_user_purpose" ON "verification_tokens" ("user_id", "purpose")`);

        // ── elections: two-level review workflow ────────────────────────
        await queryRunner.query(`ALTER TYPE "public"."elections_status_enum" ADD VALUE 'pending_review'`);
        await queryRunner.query(`ALTER TYPE "public"."elections_status_enum" ADD VALUE 'approved'`);
        await queryRunner.query(`ALTER TYPE "public"."elections_status_enum" ADD VALUE 'rejected'`);
        await queryRunner.query(`ALTER TABLE "elections" ADD "rejection_reason" text`);

        // ── audit_logs: fields required by section 16 that were missing ─
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "user_agent" character varying`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "user_agent"`);

        await queryRunner.query(`ALTER TABLE "elections" DROP COLUMN "rejection_reason"`);

        // Postgres has no DROP VALUE for enums — rebuild elections_status_enum
        // without the added values. This assumes no election row currently
        // has one of those statuses; if it does, this cast will fail (by
        // design — silently dropping in-use statuses would corrupt data).
        await queryRunner.query(`ALTER TYPE "public"."elections_status_enum" RENAME TO "elections_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."elections_status_enum" AS ENUM('draft', 'active', 'closed')`);
        await queryRunner.query(`ALTER TABLE "elections" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "elections" ALTER COLUMN "status" TYPE "public"."elections_status_enum" USING "status"::text::"public"."elections_status_enum"`);
        await queryRunner.query(`ALTER TABLE "elections" ALTER COLUMN "status" SET DEFAULT 'draft'`);
        await queryRunner.query(`DROP TYPE "public"."elections_status_enum_old"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_verification_tokens_user_purpose"`);
        await queryRunner.query(`ALTER TABLE "verification_tokens" DROP CONSTRAINT "FK_verification_tokens_user_id"`);
        await queryRunner.query(`DROP TABLE "verification_tokens"`);
        await queryRunner.query(`DROP TYPE "public"."verification_tokens_purpose_enum"`);

        await queryRunner.query(`DROP INDEX "public"."IDX_organizer_profiles_verification_status"`);
        await queryRunner.query(`ALTER TABLE "organizer_profiles" DROP CONSTRAINT "FK_organizer_profiles_reviewed_by"`);
        await queryRunner.query(`ALTER TABLE "organizer_profiles" DROP CONSTRAINT "FK_organizer_profiles_user_id"`);
        await queryRunner.query(`DROP TABLE "organizer_profiles"`);
        await queryRunner.query(`DROP TYPE "public"."organizer_profiles_verification_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."organizer_profiles_organization_type_enum"`);

        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verified"`);

        // Same caveat as above: fails if any user currently has role='organizer'.
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'voter')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::text::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'voter'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
    }
}
