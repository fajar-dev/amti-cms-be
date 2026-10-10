import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateSettingsTable1791364316010 implements MigrationInterface {
    name = "CreateSettingsTable1791364316010"

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres"

        if (isPostgres) {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "settings" (
                    "id" SERIAL PRIMARY KEY,
                    "site_name" character varying(255) NOT NULL DEFAULT 'AMTI',
                    "site_description" text,
                    "meta_keywords" text,
                    "author" character varying(255),
                    "copyright" character varying(255),
                    "logo" character varying(500),
                    "favicon" character varying(500),
                    "og_image" character varying(500),
                    "phone" character varying(50),
                    "email" character varying(255),
                    "address" text,
                    "facebook" character varying(500),
                    "instagram" character varying(500),
                    "tiktok" character varying(500),
                    "linkedin" character varying(500),
                    "twitter" character varying(500),
                    "youtube" character varying(500),
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `)
        } else {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`settings\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`site_name\` varchar(255) NOT NULL DEFAULT 'AMTI',
                    \`site_description\` text,
                    \`meta_keywords\` text,
                    \`author\` varchar(255),
                    \`copyright\` varchar(255),
                    \`logo\` varchar(500),
                    \`favicon\` varchar(500),
                    \`og_image\` varchar(500),
                    \`phone\` varchar(50),
                    \`email\` varchar(255),
                    \`address\` text,
                    \`facebook\` varchar(500),
                    \`instagram\` varchar(500),
                    \`tiktok\` varchar(500),
                    \`linkedin\` varchar(500),
                    \`twitter\` varchar(500),
                    \`youtube\` varchar(500),
                    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres"

        if (isPostgres) {
            await queryRunner.query(`DROP TABLE IF EXISTS "settings"`)
        } else {
            await queryRunner.query(`DROP TABLE IF EXISTS \`settings\``)
        }
    }
}
