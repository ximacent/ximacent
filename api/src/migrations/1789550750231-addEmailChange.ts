import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailChange1789550750231 implements MigrationInterface {
    name = 'AddEmailChange1789550750231'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "pending_email" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "pending_email"`);
    }

}
