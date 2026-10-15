import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateLiveChatTables1791364316014 implements MigrationInterface {
    name = "CreateLiveChatTables1791364316014"

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres"

        if (isPostgres) {
            await queryRunner.query(`
                CREATE TYPE "chat_ticket_status_enum" AS ENUM('WAITING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');
            `)
            await queryRunner.query(`
                CREATE TYPE "chat_sender_type_enum" AS ENUM('VISITOR', 'USER', 'SYSTEM');
            `)
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "chat_sessions" (
                    "id" SERIAL PRIMARY KEY,
                    "ticket_number" character varying(50) NOT NULL UNIQUE,
                    "session_token" character varying(100) NOT NULL UNIQUE,
                    "visitor_name" character varying(150) NOT NULL,
                    "visitor_email" character varying(150) NOT NULL,
                    "visitor_phone" character varying(50) NOT NULL,
                    "visitor_company" character varying(150) NOT NULL,
                    "status" "chat_ticket_status_enum" NOT NULL DEFAULT 'WAITING',
                    "assigned_to_id" integer,
                    "assigned_at" TIMESTAMP,
                    "last_message_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "unread_count_user" integer NOT NULL DEFAULT 0,
                    "unread_count_visitor" integer NOT NULL DEFAULT 0,
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "FK_chat_sessions_assigned_to" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL
                );
            `)
            await queryRunner.query(`CREATE INDEX "IDX_chat_sessions_status" ON "chat_sessions" ("status");`)
            await queryRunner.query(`CREATE INDEX "IDX_chat_sessions_last_message" ON "chat_sessions" ("last_message_at");`)

            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "chat_messages" (
                    "id" SERIAL PRIMARY KEY,
                    "session_id" integer NOT NULL,
                    "sender_type" "chat_sender_type_enum" NOT NULL,
                    "sender_id" integer,
                    "sender_name" character varying(150) NOT NULL,
                    "message" text,
                    "media_url" character varying(500),
                    "media_type" character varying(100),
                    "media_name" character varying(255),
                    "media_size" integer,
                    "is_read" boolean NOT NULL DEFAULT false,
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT "FK_chat_messages_session" FOREIGN KEY ("session_id") REFERENCES "chat_sessions"("id") ON DELETE CASCADE
                );
            `)
            await queryRunner.query(`CREATE INDEX "IDX_chat_messages_session_id" ON "chat_messages" ("session_id");`)
            await queryRunner.query(`CREATE INDEX "IDX_chat_messages_created_at" ON "chat_messages" ("created_at");`)
        } else {
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`chat_sessions\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`ticket_number\` varchar(50) NOT NULL,
                    \`session_token\` varchar(100) NOT NULL,
                    \`visitor_name\` varchar(150) NOT NULL,
                    \`visitor_email\` varchar(150) NOT NULL,
                    \`visitor_phone\` varchar(50) NOT NULL,
                    \`visitor_company\` varchar(150) NOT NULL,
                    \`status\` enum('WAITING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'WAITING',
                    \`assigned_to_id\` int NULL,
                    \`assigned_at\` datetime NULL,
                    \`last_message_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`unread_count_user\` int NOT NULL DEFAULT 0,
                    \`unread_count_visitor\` int NOT NULL DEFAULT 0,
                    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    UNIQUE INDEX \`IDX_chat_sessions_ticket_number\` (\`ticket_number\`),
                    UNIQUE INDEX \`IDX_chat_sessions_session_token\` (\`session_token\`),
                    INDEX \`IDX_chat_sessions_status\` (\`status\`),
                    INDEX \`IDX_chat_sessions_last_message\` (\`last_message_at\`),
                    PRIMARY KEY (\`id\`),
                    CONSTRAINT \`FK_chat_sessions_assigned_to\` FOREIGN KEY (\`assigned_to_id\`) REFERENCES \`users\` (\`id\`) ON DELETE SET NULL
                ) ENGINE=InnoDB
            `)

            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`chat_messages\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`session_id\` int NOT NULL,
                    \`sender_type\` enum('VISITOR', 'USER', 'SYSTEM') NOT NULL,
                    \`sender_id\` int NULL,
                    \`sender_name\` varchar(150) NOT NULL,
                    \`message\` text NULL,
                    \`media_url\` varchar(500) NULL,
                    \`media_type\` varchar(100) NULL,
                    \`media_name\` varchar(255) NULL,
                    \`media_size\` int NULL,
                    \`is_read\` tinyint NOT NULL DEFAULT 0,
                    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    INDEX \`IDX_chat_messages_session_id\` (\`session_id\`),
                    INDEX \`IDX_chat_messages_created_at\` (\`created_at\`),
                    PRIMARY KEY (\`id\`),
                    CONSTRAINT \`FK_chat_messages_session\` FOREIGN KEY (\`session_id\`)
                        REFERENCES \`chat_sessions\` (\`id\`) ON DELETE CASCADE
                ) ENGINE=InnoDB
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres"

        if (isPostgres) {
            await queryRunner.query(`DROP TABLE IF EXISTS "chat_messages"`)
            await queryRunner.query(`DROP TABLE IF EXISTS "chat_sessions"`)
            await queryRunner.query(`DROP TYPE IF EXISTS "chat_sender_type_enum"`)
            await queryRunner.query(`DROP TYPE IF EXISTS "chat_ticket_status_enum"`)
        } else {
            await queryRunner.query(`DROP TABLE IF EXISTS \`chat_messages\``)
            await queryRunner.query(`DROP TABLE IF EXISTS \`chat_sessions\``)
        }
    }
}
