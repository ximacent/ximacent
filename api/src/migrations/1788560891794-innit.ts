import { MigrationInterface, QueryRunner } from "typeorm";

export class Innit1788560891794 implements MigrationInterface {
    name = 'Innit1788560891794'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('pending', 'success', 'failed')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isDeleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "provider" character varying(50) NOT NULL DEFAULT 'paystack', "provider_reference" character varying(255) NOT NULL, "amount" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'GHS', "status" "public"."payments_status_enum" NOT NULL DEFAULT 'pending', "user_id" uuid, CONSTRAINT "UQ_de9cb5e46ac2a317daf1e201d24" UNIQUE ("provider_reference"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "votes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "voter_email" character varying, "voter_phone" character varying, "quantity" integer NOT NULL DEFAULT '1', "election_id" uuid, "category_id" uuid, "nominee_id" uuid, "payment_id" uuid, CONSTRAINT "PK_f3d9fd4a0af865152c3f59db8ff" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "nominees" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isDeleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "bio" text, "image_url" character varying, "code" character varying(20) NOT NULL, "category_id" uuid, CONSTRAINT "UQ_5e95f7b33b6fcfcb8adb25f9f68" UNIQUE ("code"), CONSTRAINT "PK_95bea8d75c23afade5aef834a7b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isDeleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying(255) NOT NULL, "description" text, "display_order" integer NOT NULL DEFAULT '0', "election_id" uuid, CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."elections_status_enum" AS ENUM('draft', 'active', 'closed')`);
        await queryRunner.query(`CREATE TABLE "elections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isDeleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "title" character varying(255) NOT NULL, "slug" character varying(255) NOT NULL, "description" text, "start_date" TIMESTAMP WITH TIME ZONE NOT NULL, "end_date" TIMESTAMP WITH TIME ZONE NOT NULL, "status" "public"."elections_status_enum" NOT NULL DEFAULT 'draft', "created_by" uuid, CONSTRAINT "UQ_43f359038496720f003d917a58d" UNIQUE ("slug"), CONSTRAINT "PK_21abca6e4191b830d1eb8379cf0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'voter')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "isDeleted" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "firstName" character varying(255) NOT NULL, "lastName" character varying(255) NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying NOT NULL, "phone" character varying(20), "role" "public"."users_role_enum" NOT NULL DEFAULT 'voter', "is_verified" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "audit_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "action" character varying NOT NULL, "entity_type" character varying NOT NULL, "entity_id" character varying, "metadata" jsonb, "ip_address" character varying, "actor_id" uuid, CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_427785468fb7d2733f59e7d7d39" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "votes" ADD CONSTRAINT "FK_4ad69daaa81656c07c10d833dc4" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "votes" ADD CONSTRAINT "FK_cc4f1b13e5fabd156366e7bcf17" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "votes" ADD CONSTRAINT "FK_d41bd61d43ec1f526b437622bdc" FOREIGN KEY ("nominee_id") REFERENCES "nominees"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "votes" ADD CONSTRAINT "FK_1db033d9161962eebcae74bccb5" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "nominees" ADD CONSTRAINT "FK_b2895c39a96a8dd671881df06ab" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "categories" ADD CONSTRAINT "FK_8d3a547824811f5546d486704dc" FOREIGN KEY ("election_id") REFERENCES "elections"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "elections" ADD CONSTRAINT "FK_f0be556ca641069809597863a02" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_177183f29f438c488b5e8510cdb" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_177183f29f438c488b5e8510cdb"`);
        await queryRunner.query(`ALTER TABLE "elections" DROP CONSTRAINT "FK_f0be556ca641069809597863a02"`);
        await queryRunner.query(`ALTER TABLE "categories" DROP CONSTRAINT "FK_8d3a547824811f5546d486704dc"`);
        await queryRunner.query(`ALTER TABLE "nominees" DROP CONSTRAINT "FK_b2895c39a96a8dd671881df06ab"`);
        await queryRunner.query(`ALTER TABLE "votes" DROP CONSTRAINT "FK_1db033d9161962eebcae74bccb5"`);
        await queryRunner.query(`ALTER TABLE "votes" DROP CONSTRAINT "FK_d41bd61d43ec1f526b437622bdc"`);
        await queryRunner.query(`ALTER TABLE "votes" DROP CONSTRAINT "FK_cc4f1b13e5fabd156366e7bcf17"`);
        await queryRunner.query(`ALTER TABLE "votes" DROP CONSTRAINT "FK_4ad69daaa81656c07c10d833dc4"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_427785468fb7d2733f59e7d7d39"`);
        await queryRunner.query(`DROP TABLE "audit_logs"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "elections"`);
        await queryRunner.query(`DROP TYPE "public"."elections_status_enum"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "nominees"`);
        await queryRunner.query(`DROP TABLE "votes"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    }

}
