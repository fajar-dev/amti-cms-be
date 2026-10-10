import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMessagesTable1791364316011 implements MigrationInterface {
    name = "CreateMessagesTable1791364316011";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "messages" (
                    "id" SERIAL PRIMARY KEY,
                    "name" character varying(255) NOT NULL,
                    "email" character varying(255) NOT NULL,
                    "phone" character varying(50),
                    "subject" character varying(255) NOT NULL,
                    "message" text NOT NULL,
                    "is_read" boolean NOT NULL DEFAULT false,
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_messages_is_read" ON "messages" ("is_read")
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_messages_created_at" ON "messages" ("created_at")
            `);
        } else {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`messages\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`name\` varchar(255) NOT NULL,
                    \`email\` varchar(255) NOT NULL,
                    \`phone\` varchar(50) DEFAULT NULL,
                    \`subject\` varchar(255) NOT NULL,
                    \`message\` text NOT NULL,
                    \`is_read\` tinyint NOT NULL DEFAULT 0,
                    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    INDEX \`IDX_messages_is_read\` (\`is_read\`),
                    INDEX \`IDX_messages_created_at\` (\`created_at\`),
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`DROP TABLE IF EXISTS "messages"`);
        } else {
            await queryRunner.query(`DROP TABLE IF EXISTS \`messages\``);
        }
    }
}
