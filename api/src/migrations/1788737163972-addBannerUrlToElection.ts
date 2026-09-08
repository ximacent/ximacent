import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBannerUrlToElection1788737163972 implements MigrationInterface {
    name = 'AddBannerUrlToElection1788737163972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "elections" DROP CONSTRAINT "FK_f0be556ca641069809597863a02"`);
        await queryRunner.query(`ALTER TABLE "elections" ADD "banner_url" character varying`);
        await queryRunner.query(`ALTER TABLE "elections" ADD CONSTRAINT "FK_f0be556ca641069809597863a02" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "elections" DROP CONSTRAINT "FK_f0be556ca641069809597863a02"`);
        await queryRunner.query(`ALTER TABLE "elections" DROP COLUMN "banner_url"`);
        await queryRunner.query(`ALTER TABLE "elections" ADD CONSTRAINT "FK_f0be556ca641069809597863a02" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

}
