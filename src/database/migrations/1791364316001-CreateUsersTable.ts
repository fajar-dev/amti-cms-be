import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUsersTable1791364316001 implements MigrationInterface {
    name = 'CreateUsersTable1791364316001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "users" (
                    "id" SERIAL PRIMARY KEY,
                    "name" character varying(255) NOT NULL,
                    "photo" character varying(255) NULL,
                    "email" character varying(255) NOT NULL,
                    "password" character varying(255) NULL,
                    "is_active" boolean NOT NULL DEFAULT true,
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "UQ_users_email" UNIQUE ("email")
                )
            `);
        } else {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`users\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`name\` varchar(255) NOT NULL,
                    \`photo\` varchar(255) NULL,
                    \`email\` varchar(255) NOT NULL,
                    \`password\` varchar(255) NULL,
                    \`is_active\` tinyint NOT NULL DEFAULT 1,
                    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`),
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
        } else {
            await queryRunner.query(`DROP TABLE IF EXISTS \`users\``);
        }
    }
}
