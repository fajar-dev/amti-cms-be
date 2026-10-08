import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateContactsTable1791364316002 implements MigrationInterface {
    name = 'CreateContactsTable1791364316002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`
                DO $$ BEGIN
                    CREATE TYPE "contacts_salutation_enum" AS ENUM('mr', 'mrs');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
            await queryRunner.query(`
                DO $$ BEGIN
                    CREATE TYPE "contacts_type_enum" AS ENUM('customer', 'vendor', 'supplier', 'other');
                EXCEPTION
                    WHEN duplicate_object THEN null;
                END $$;
            `);
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "contacts" (
                    "id" SERIAL PRIMARY KEY,
                    "name" character varying(255) NOT NULL,
                    "salutation" "contacts_salutation_enum" NULL,
                    "email" character varying(255) NULL,
                    "phone" character varying(255) NULL,
                    "type" "contacts_type_enum" NOT NULL DEFAULT 'customer',
                    "is_active" boolean NOT NULL DEFAULT true,
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `);
        } else {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`contacts\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`name\` varchar(255) NOT NULL,
                    \`salutation\` enum ('mr', 'mrs') NULL,
                    \`email\` varchar(255) NULL,
                    \`phone\` varchar(255) NULL,
                    \`type\` enum ('customer', 'vendor', 'supplier', 'other') NOT NULL DEFAULT 'customer',
                    \`is_active\` tinyint NOT NULL DEFAULT 1,
                    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`DROP TABLE IF EXISTS "contacts"`);
            await queryRunner.query(`DROP TYPE IF EXISTS "contacts_type_enum"`);
            await queryRunner.query(`DROP TYPE IF EXISTS "contacts_salutation_enum"`);
        } else {
            await queryRunner.query(`DROP TABLE IF EXISTS \`contacts\``);
        }
    }
}
