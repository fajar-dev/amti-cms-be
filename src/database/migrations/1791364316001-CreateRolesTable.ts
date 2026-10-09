import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRolesTable1791364316001 implements MigrationInterface {
    name = "CreateRolesTable1791364316001";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "roles" (
                    "id" SERIAL PRIMARY KEY,
                    "name" character varying(100) NOT NULL,
                    "description" text NULL,
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "UQ_roles_name" UNIQUE ("name")
                )
            `);
        } else {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`roles\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`name\` varchar(100) NOT NULL,
                    \`description\` text NULL,
                    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    UNIQUE INDEX \`UQ_roles_name\` (\`name\`),
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
        } else {
            await queryRunner.query(`DROP TABLE IF EXISTS \`roles\``);
        }
    }
}
