import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateContentTables1791364316003 implements MigrationInterface {
    name = "CreateContentTables1791364316003";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            // Enum for article status
            await queryRunner.query(`
                DO $$ BEGIN
                    CREATE TYPE "articles_status_enum" AS ENUM('draft', 'publish');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);

            // Categories table
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

            // Articles table
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "articles" (
                    "id" SERIAL PRIMARY KEY,
                    "author_id" integer NULL,
                    "category_id" integer NULL,
                    "title" character varying(255) NOT NULL,
                    "slug" character varying(255) NOT NULL,
                    "description" text NULL,
                    "cover" character varying(255) NULL,
                    "content" text NOT NULL,
                    "tags" jsonb NULL,
                    "status" "articles_status_enum" NOT NULL DEFAULT 'draft',
                    "views_count" integer NOT NULL DEFAULT 0,
                    "published_at" TIMESTAMP NULL,
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "UQ_articles_slug" UNIQUE ("slug"),
                    CONSTRAINT "FK_articles_author" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE SET NULL,
                    CONSTRAINT "FK_articles_category" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL
                )
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_articles_slug" ON "articles" ("slug")
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_articles_author_id" ON "articles" ("author_id")
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_articles_category_id" ON "articles" ("category_id")
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_articles_status" ON "articles" ("status")
            `);

            // Article Views table
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
            // MySQL Categories table
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

            // MySQL Articles table
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`articles\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`author_id\` int NULL,
                    \`category_id\` int NULL,
                    \`title\` varchar(255) NOT NULL,
                    \`slug\` varchar(255) NOT NULL,
                    \`description\` text NULL,
                    \`cover\` varchar(255) NULL,
                    \`content\` longtext NOT NULL,
                    \`tags\` json NULL,
                    \`status\` enum('draft', 'publish') NOT NULL DEFAULT 'draft',
                    \`views_count\` int NOT NULL DEFAULT 0,
                    \`published_at\` timestamp NULL,
                    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    UNIQUE INDEX \`UQ_articles_slug\` (\`slug\`),
                    INDEX \`IDX_articles_author_id\` (\`author_id\`),
                    INDEX \`IDX_articles_category_id\` (\`category_id\`),
                    INDEX \`IDX_articles_status\` (\`status\`),
                    CONSTRAINT \`FK_articles_author\` FOREIGN KEY (\`author_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL,
                    CONSTRAINT \`FK_articles_category\` FOREIGN KEY (\`category_id\`) REFERENCES \`categories\` (\`id\`) ON DELETE SET NULL,
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);

            // MySQL Article Views table
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
            await queryRunner.query(`DROP TABLE IF EXISTS "articles"`);
            await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
            await queryRunner.query(`DROP TYPE IF EXISTS "articles_status_enum"`);
        } else {
            await queryRunner.query(`DROP TABLE IF EXISTS \`article_views\``);
            await queryRunner.query(`DROP TABLE IF EXISTS \`articles\``);
            await queryRunner.query(`DROP TABLE IF EXISTS \`categories\``);
        }
    }
}
