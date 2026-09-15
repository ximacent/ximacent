import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPhoneChange1789501924449 implements MigrationInterface {
    name = 'AddPhoneChange1789501924449'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "pending_phone" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "pending_phone"`);
    }

}
