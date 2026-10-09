import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCategoriesTable1791364316006 implements MigrationInterface {
    name = "CreateCategoriesTable1791364316006";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "categories" (
                    "id" SERIAL PRIMARY KEY,
                    "name" character varying(255) NOT NULL,
                    "slug" character varying(255) NOT NULL,
                    "description" text NULL,
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "UQ_categories_slug" UNIQUE ("slug")
                )
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_categories_slug" ON "categories" ("slug")
            `);
        } else {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`categories\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`name\` varchar(255) NOT NULL,
                    \`slug\` varchar(255) NOT NULL,
                    \`description\` text NULL,
                    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    UNIQUE INDEX \`UQ_categories_slug\` (\`slug\`),
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
        } else {
            await queryRunner.query(`DROP TABLE IF EXISTS \`categories\``);
        }
    }
}
