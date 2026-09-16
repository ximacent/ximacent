import { MigrationInterface, QueryRunner } from "typeorm";

export class PhoneVerificationAndGhCard1789216419373 implements MigrationInterface {
    name = 'PhoneVerificationAndGhCard1789216419373'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ── users: phone verification ──────────────────────────────────
        await queryRunner.query(`ALTER TABLE "users" ADD "phone_verified" boolean NOT NULL DEFAULT false`);

        // ── verification_tokens: new purpose value ──────────────────────
        await queryRunner.query(`ALTER TYPE "public"."verification_tokens_purpose_enum" ADD VALUE 'phone_verification'`);

        // ── organizer_profiles: Ghana Card fields ───────────────────────
        await queryRunner.query(`ALTER TABLE "organizer_profiles" ADD "gh_card_number" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "organizer_profiles" ADD CONSTRAINT "UQ_organizer_profiles_gh_card_number" UNIQUE ("gh_card_number")`);
        await queryRunner.query(`ALTER TABLE "organizer_profiles" ADD "gh_card_image_url" character varying(500)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizer_profiles" DROP COLUMN "gh_card_image_url"`);
        await queryRunner.query(`ALTER TABLE "organizer_profiles" DROP CONSTRAINT "UQ_organizer_profiles_gh_card_number"`);
        await queryRunner.query(`ALTER TABLE "organizer_profiles" DROP COLUMN "gh_card_number"`);

        // Postgres has no DROP VALUE for enums — same caveat as the earlier
        // migration: this fails if any row currently uses 'phone_verification'.
        await queryRunner.query(`ALTER TYPE "public"."verification_tokens_purpose_enum" RENAME TO "verification_tokens_purpose_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."verification_tokens_purpose_enum" AS ENUM('email_verification', 'password_reset')`);
        await queryRunner.query(`ALTER TABLE "verification_tokens" ALTER COLUMN "purpose" TYPE "public"."verification_tokens_purpose_enum" USING "purpose"::text::"public"."verification_tokens_purpose_enum"`);
        await queryRunner.query(`DROP TYPE "public"."verification_tokens_purpose_enum_old"`);

        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone_verified"`);
    }
}
