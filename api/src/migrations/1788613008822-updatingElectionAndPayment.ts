import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatingElectionAndPayment1788613008822 implements MigrationInterface {
    name = 'UpdatingElectionAndPayment1788613008822'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "elections" DROP CONSTRAINT "FK_f0be556ca641069809597863a02"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "quantity" integer NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "voter_email" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "voter_phone" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "nominee_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "elections" ADD "price_per_vote" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "elections" ALTER COLUMN "created_by" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_0ca92b60cac66d00d43bfdaf6f3" FOREIGN KEY ("nominee_id") REFERENCES "nominees"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "elections" ADD CONSTRAINT "FK_f0be556ca641069809597863a02" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "elections" DROP CONSTRAINT "FK_f0be556ca641069809597863a02"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_0ca92b60cac66d00d43bfdaf6f3"`);
        await queryRunner.query(`ALTER TABLE "elections" ALTER COLUMN "created_by" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "elections" DROP COLUMN "price_per_vote"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "nominee_id"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "voter_phone"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "voter_email"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "quantity"`);
        await queryRunner.query(`ALTER TABLE "elections" ADD CONSTRAINT "FK_f0be556ca641069809597863a02" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
