import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPendingPhone1789500819905 implements MigrationInterface {
    name = 'AddPendingPhone1789500819905'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "pending_phone" character varying(20)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "pending_phone"`);
    }
}
