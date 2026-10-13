import { MigrationInterface, QueryRunner } from "typeorm"

export class AddWhatsappAndMapsUrlToSettingsTable1791364316012 implements MigrationInterface {
    name = "AddWhatsappAndMapsUrlToSettingsTable1791364316012"

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres"

        if (isPostgres) {
            await queryRunner.query(`
                ALTER TABLE "settings"
                ADD COLUMN IF NOT EXISTS "whatsapp" character varying(50),
                ADD COLUMN IF NOT EXISTS "maps_url" text;
            `)
        } else {
            await queryRunner.query(`
                ALTER TABLE \`settings\`
                ADD COLUMN \`whatsapp\` varchar(50) NULL AFTER \`phone\`,
                ADD COLUMN \`maps_url\` text NULL AFTER \`address\`;
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres"

        if (isPostgres) {
            await queryRunner.query(`
                ALTER TABLE "settings"
                DROP COLUMN IF EXISTS "whatsapp",
                DROP COLUMN IF EXISTS "maps_url";
            `)
        } else {
            await queryRunner.query(`
                ALTER TABLE \`settings\`
                DROP COLUMN \`whatsapp\`,
                DROP COLUMN \`maps_url\`;
            `)
        }
    }
}
