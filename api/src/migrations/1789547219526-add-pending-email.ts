import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPendingEmail1789547219526 implements MigrationInterface {
    name = 'AddPendingEmail1789547219526'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "pending_email" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "pending_email"`);
    }
}
