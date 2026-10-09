import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateArticleViewsTable1791364316008 implements MigrationInterface {
    name = "CreateArticleViewsTable1791364316008";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "article_views" (
                    "id" SERIAL PRIMARY KEY,
                    "article_id" integer NOT NULL,
                    "ip_address" character varying(45) NULL,
                    "user_agent" text NULL,
                    "referrer" character varying(500) NULL,
                    "user_id" integer NULL,
                    "viewed_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "FK_article_views_article" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE
                )
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_article_views_article_id" ON "article_views" ("article_id")
            `);
        } else {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`article_views\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`article_id\` int NOT NULL,
                    \`ip_address\` varchar(45) NULL,
                    \`user_agent\` text NULL,
                    \`referrer\` varchar(500) NULL,
                    \`user_id\` int NULL,
                    \`viewed_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    INDEX \`IDX_article_views_article_id\` (\`article_id\`),
                    CONSTRAINT \`FK_article_views_article\` FOREIGN KEY (\`article_id\`) REFERENCES \`articles\` (\`id\`) ON DELETE CASCADE,
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`DROP TABLE IF EXISTS "article_views"`);
        } else {
            await queryRunner.query(`DROP TABLE IF EXISTS \`article_views\``);
        }
    }
}
