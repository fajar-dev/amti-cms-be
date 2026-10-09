import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFaqsTable1791364316009 implements MigrationInterface {
    name = "CreateFaqsTable1791364316009";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "faqs" (
                    "id" SERIAL PRIMARY KEY,
                    "question" character varying(500) NOT NULL,
                    "answer" text NOT NULL,
                    "order" integer NOT NULL DEFAULT 0,
                    "is_active" boolean NOT NULL DEFAULT true,
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_faqs_order" ON "faqs" ("order")
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_faqs_is_active" ON "faqs" ("is_active")
            `);
        } else {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`faqs\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`question\` varchar(500) NOT NULL,
                    \`answer\` text NOT NULL,
                    \`order\` int NOT NULL DEFAULT 0,
                    \`is_active\` tinyint NOT NULL DEFAULT 1,
                    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    INDEX \`IDX_faqs_order\` (\`order\`),
                    INDEX \`IDX_faqs_is_active\` (\`is_active\`),
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`DROP TABLE IF EXISTS "faqs"`);
        } else {
            await queryRunner.query(`DROP TABLE IF EXISTS \`faqs\``);
        }
    }
}
