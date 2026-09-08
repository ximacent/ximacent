import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSlugToElection1788568377717 implements MigrationInterface {
    name = 'AddSlugToElection1788568377717'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "elections" ADD "alias" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "elections" ADD CONSTRAINT "UQ_64d001e594dddac45eb2ecc4a80" UNIQUE ("alias")`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "UQ_ae1a68c788dcade273b4f6d11e5" UNIQUE ("name", "election_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "UQ_ae1a68c788dcade273b4f6d11e5"`);
        await queryRunner.query(`ALTER TABLE "elections" DROP CONSTRAINT "UQ_64d001e594dddac45eb2ecc4a80"`);
        await queryRunner.query(`ALTER TABLE "elections" DROP COLUMN "alias"`);
    }

}
