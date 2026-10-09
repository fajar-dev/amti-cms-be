import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePermissionsTable1791364316002 implements MigrationInterface {
    name = "CreatePermissionsTable1791364316002";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "permissions" (
                    "id" SERIAL PRIMARY KEY,
                    "name" character varying(100) NOT NULL,
                    "module" character varying(100) NOT NULL,
                    "description" text NULL,
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "UQ_permissions_name" UNIQUE ("name")
                )
            `);
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_permissions_module" ON "permissions" ("module")
            `);
        } else {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`permissions\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`name\` varchar(100) NOT NULL,
                    \`module\` varchar(100) NOT NULL,
                    \`description\` text NULL,
                    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    UNIQUE INDEX \`UQ_permissions_name\` (\`name\`),
                    INDEX \`IDX_permissions_module\` (\`module\`),
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
        } else {
            await queryRunner.query(`DROP TABLE IF EXISTS \`permissions\``);
        }
    }
}
