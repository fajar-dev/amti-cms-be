import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePasswordResetTokensTable1791364316002 implements MigrationInterface {
    name = 'CreatePasswordResetTokensTable1791364316002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
                    "id" SERIAL PRIMARY KEY,
                    "email" character varying(255) NOT NULL,
                    "token" character varying(255) NOT NULL,
                    "expires_at" TIMESTAMP NOT NULL,
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_password_reset_tokens_email" ON "password_reset_tokens" ("email")
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_password_reset_tokens_token" ON "password_reset_tokens" ("token")
            `);
        } else {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`password_reset_tokens\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`email\` varchar(255) NOT NULL,
                    \`token\` varchar(255) NOT NULL,
                    \`expires_at\` timestamp NOT NULL,
                    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    INDEX \`IDX_password_reset_tokens_email\` (\`email\`),
                    INDEX \`IDX_password_reset_tokens_token\` (\`token\`),
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`DROP TABLE IF EXISTS "password_reset_tokens"`);
        } else {
            await queryRunner.query(`DROP TABLE IF EXISTS \`password_reset_tokens\``);
        }
    }
}
