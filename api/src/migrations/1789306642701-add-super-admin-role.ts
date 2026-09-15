import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuperAdminRole1789306642701 implements MigrationInterface {
    name = 'AddSuperAdminRole1789306642701'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" ADD VALUE 'super_admin'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Postgres has no DROP VALUE for enums — same caveat as earlier
        // migrations: this fails if any user currently has role='super_admin'.
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'voter', 'organizer')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::text::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'voter'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
    }
}
