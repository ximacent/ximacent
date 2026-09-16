import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameOrganizerProfilePhone1789201068704 implements MigrationInterface {
    name = 'RenameOrganizerProfilePhone1789201068704'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizer_profiles" RENAME COLUMN "phone" TO "organization_phone"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizer_profiles" RENAME COLUMN "organization_phone" TO "phone"`);
    }
}
