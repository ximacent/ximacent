import { MigrationInterface, QueryRunner } from "typeorm";

export class ExtendBaseEntityInVote1788866769452 implements MigrationInterface {
    name = 'ExtendBaseEntityInVote1788866769452'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "votes" ADD "isDeleted" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "votes" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "votes" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "elections" ADD CONSTRAINT "UQ_6f7f24fcfa8f501307cc1d40457" UNIQUE ("title")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "elections" DROP CONSTRAINT "UQ_6f7f24fcfa8f501307cc1d40457"`);
        await queryRunner.query(`ALTER TABLE "votes" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "votes" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "votes" DROP COLUMN "isDeleted"`);
    }

}
