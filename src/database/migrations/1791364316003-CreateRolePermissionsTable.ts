import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRolePermissionsTable1791364316003 implements MigrationInterface {
    name = "CreateRolePermissionsTable1791364316003";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "role_permissions" (
                    "role_id" integer NOT NULL,
                    "permission_id" integer NOT NULL,
                    PRIMARY KEY ("role_id", "permission_id"),
                    CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE,
                    CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE
                )
            `);
        } else {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`role_permissions\` (
                    \`role_id\` int NOT NULL,
                    \`permission_id\` int NOT NULL,
                    PRIMARY KEY (\`role_id\`, \`permission_id\`),
                    CONSTRAINT \`FK_role_permissions_role\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`id\`) ON DELETE CASCADE,
                    CONSTRAINT \`FK_role_permissions_permission\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\` (\`id\`) ON DELETE CASCADE
                ) ENGINE=InnoDB
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
        } else {
            await queryRunner.query(`DROP TABLE IF EXISTS \`role_permissions\``);
        }
    }
}
