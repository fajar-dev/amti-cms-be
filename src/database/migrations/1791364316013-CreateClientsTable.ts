import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateClientsTable1791364316013 implements MigrationInterface {
    name = "CreateClientsTable1791364316013"

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres"

        if (isPostgres) {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "clients" (
                    "id" SERIAL PRIMARY KEY,
                    "name" character varying(255) NOT NULL,
                    "logo" character varying(500) NOT NULL,
                    "website" character varying(500),
                    "order" integer NOT NULL DEFAULT 0,
                    "is_active" boolean NOT NULL DEFAULT true,
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `)
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_clients_order" ON "clients" ("order")
            `)
            await queryRunner.query(`
                CREATE INDEX IF NOT EXISTS "IDX_clients_is_active" ON "clients" ("is_active")
            `)
        } else {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`clients\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`name\` varchar(255) NOT NULL,
                    \`logo\` varchar(500) NOT NULL,
                    \`website\` varchar(500) NULL,
                    \`order\` int NOT NULL DEFAULT 0,
                    \`is_active\` tinyint NOT NULL DEFAULT 1,
                    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    INDEX \`IDX_clients_order\` (\`order\`),
                    INDEX \`IDX_clients_is_active\` (\`is_active\`),
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres"

        if (isPostgres) {
            await queryRunner.query(`DROP TABLE IF EXISTS "clients"`)
        } else {
            await queryRunner.query(`DROP TABLE IF EXISTS \`clients\``)
        }
    }
}
