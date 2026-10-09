import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRbacTables1791364316005 implements MigrationInterface {
    name = "CreateRbacTables1791364316005";

    public async up(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            // 1. Roles table
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "roles" (
                    "id" SERIAL PRIMARY KEY,
                    "name" character varying(100) NOT NULL UNIQUE,
                    "display_name" character varying(150) NOT NULL,
                    "description" text NULL,
                    "is_system" boolean NOT NULL DEFAULT false,
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // 2. Permissions table
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "permissions" (
                    "id" SERIAL PRIMARY KEY,
                    "name" character varying(100) NOT NULL UNIQUE,
                    "module" character varying(100) NOT NULL,
                    "description" text NULL,
                    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            `);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_permissions_module" ON "permissions" ("module")`);

            // 3. Role-Permissions junction table
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS "role_permissions" (
                    "role_id" integer NOT NULL,
                    "permission_id" integer NOT NULL,
                    PRIMARY KEY ("role_id", "permission_id"),
                    CONSTRAINT "FK_role_permissions_role" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE CASCADE,
                    CONSTRAINT "FK_role_permissions_permission" FOREIGN KEY ("permission_id") REFERENCES "permissions" ("id") ON DELETE CASCADE
                )
            `);

            // 4. Add role_id to users
            await queryRunner.query(`
                ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role_id" integer NULL
            `);
            await queryRunner.query(`
                DO $$ BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM pg_constraint WHERE conname = 'FK_users_role'
                    ) THEN
                        ALTER TABLE "users" ADD CONSTRAINT "FK_users_role" FOREIGN KEY ("role_id") REFERENCES "roles" ("id") ON DELETE SET NULL;
                    END IF;
                END $$;
            `);
            await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_users_role_id" ON "users" ("role_id")`);
        } else {
            // MySQL
            // 1. Roles table
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`roles\` (
                    \`id\` int NOT NULL AUTO_INCREMENT,
                    \`name\` varchar(100) NOT NULL,
                    \`display_name\` varchar(150) NOT NULL,
                    \`description\` text NULL,
                    \`is_system\` tinyint NOT NULL DEFAULT 0,
                    \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                    UNIQUE INDEX \`UQ_roles_name\` (\`name\`),
                    PRIMARY KEY (\`id\`)
                ) ENGINE=InnoDB
            `);

            // 2. Permissions table
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

            // 3. Role-Permissions junction table
            await queryRunner.query(`
                CREATE TABLE IF NOT EXISTS \`role_permissions\` (
                    \`role_id\` int NOT NULL,
                    \`permission_id\` int NOT NULL,
                    PRIMARY KEY (\`role_id\`, \`permission_id\`),
                    CONSTRAINT \`FK_role_permissions_role\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`id\`) ON DELETE CASCADE,
                    CONSTRAINT \`FK_role_permissions_permission\` FOREIGN KEY (\`permission_id\`) REFERENCES \`permissions\` (\`id\`) ON DELETE CASCADE
                ) ENGINE=InnoDB
            `);

            // 4. Add role_id to users
            const hasRoleIdColumn = await queryRunner.hasColumn("users", "role_id");
            if (!hasRoleIdColumn) {
                await queryRunner.query(`
                    ALTER TABLE \`users\` ADD COLUMN \`role_id\` int NULL
                `);
                await queryRunner.query(`
                    ALTER TABLE \`users\` ADD CONSTRAINT \`FK_users_role\` FOREIGN KEY (\`role_id\`) REFERENCES \`roles\` (\`id\`) ON DELETE SET NULL
                `);
                await queryRunner.query(`
                    CREATE INDEX \`IDX_users_role_id\` ON \`users\` (\`role_id\`)
                `);
            }
        }

        // 5. Seed default permissions
        const permissionsData = [
            // Users
            { name: "users.view", module: "Users", description: "View users list and details" },
            { name: "users.create", module: "Users", description: "Create new users" },
            { name: "users.update", module: "Users", description: "Update existing users" },
            { name: "users.delete", module: "Users", description: "Delete users" },
            // Roles & Permissions
            { name: "roles.view", module: "Roles & Permissions", description: "View roles and permissions" },
            { name: "roles.create", module: "Roles & Permissions", description: "Create new roles" },
            { name: "roles.update", module: "Roles & Permissions", description: "Update existing roles and permission bindings" },
            { name: "roles.delete", module: "Roles & Permissions", description: "Delete non-system roles" },
            // Categories
            { name: "categories.view", module: "Categories", description: "View content categories" },
            { name: "categories.create", module: "Categories", description: "Create new category" },
            { name: "categories.update", module: "Categories", description: "Update existing category" },
            { name: "categories.delete", module: "Categories", description: "Delete category" },
            // Articles
            { name: "articles.view", module: "Articles", description: "View articles list and content" },
            { name: "articles.create", module: "Articles", description: "Create new article" },
            { name: "articles.update", module: "Articles", description: "Update existing article" },
            { name: "articles.delete", module: "Articles", description: "Delete article" },
            // FAQs
            { name: "faqs.view", module: "FAQs", description: "View FAQs list and details" },
            { name: "faqs.create", module: "FAQs", description: "Create new FAQ" },
            { name: "faqs.update", module: "FAQs", description: "Update existing FAQ" },
            { name: "faqs.delete", module: "FAQs", description: "Delete FAQ" },
        ];

        for (const perm of permissionsData) {
            if (isPostgres) {
                await queryRunner.query(
                    `INSERT INTO "permissions" ("name", "module", "description") VALUES ($1, $2, $3) ON CONFLICT ("name") DO NOTHING`,
                    [perm.name, perm.module, perm.description]
                );
            } else {
                await queryRunner.query(
                    `INSERT IGNORE INTO \`permissions\` (\`name\`, \`module\`, \`description\`) VALUES (?, ?, ?)`,
                    [perm.name, perm.module, perm.description]
                );
            }
        }

        // 6. Seed default roles
        const rolesData = [
            { name: "super_admin", displayName: "Super Admin", description: "Full system access with all permissions", isSystem: true },
            { name: "admin", displayName: "Admin", description: "Administrative access for users, content, and faqs", isSystem: false },
            { name: "editor", displayName: "Editor", description: "Can manage articles, categories, and faqs", isSystem: false },
            { name: "author", displayName: "Author", description: "Can create and view articles", isSystem: false },
        ];

        for (const r of rolesData) {
            if (isPostgres) {
                await queryRunner.query(
                    `INSERT INTO "roles" ("name", "display_name", "description", "is_system") VALUES ($1, $2, $3, $4) ON CONFLICT ("name") DO NOTHING`,
                    [r.name, r.displayName, r.description, r.isSystem]
                );
            } else {
                await queryRunner.query(
                    `INSERT IGNORE INTO \`roles\` (\`name\`, \`display_name\`, \`description\`, \`is_system\`) VALUES (?, ?, ?, ?)`,
                    [r.name, r.displayName, r.description, r.isSystem ? 1 : 0]
                );
            }
        }

        // 7. Associate permissions to roles
        // Helper to get role ID and permission IDs
        const roles = await queryRunner.query(isPostgres ? `SELECT "id", "name" FROM "roles"` : `SELECT \`id\`, \`name\` FROM \`roles\``);
        const permissions = await queryRunner.query(isPostgres ? `SELECT "id", "name" FROM "permissions"` : `SELECT \`id\`, \`name\` FROM \`permissions\``);

        const roleMap = new Map<string, number>();
        for (const role of roles) {
            roleMap.set(role.name, role.id);
        }

        const permMap = new Map<string, number>();
        for (const perm of permissions) {
            permMap.set(perm.name, perm.id);
        }

        // super_admin -> all permissions
        const superAdminId = roleMap.get("super_admin");
        if (superAdminId) {
            for (const perm of permissions) {
                if (isPostgres) {
                    await queryRunner.query(
                        `INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                        [superAdminId, perm.id]
                    );
                } else {
                    await queryRunner.query(
                        `INSERT IGNORE INTO \`role_permissions\` (\`role_id\`, \`permission_id\`) VALUES (?, ?)`,
                        [superAdminId, perm.id]
                    );
                }
            }
        }

        // admin -> all except roles.delete
        const adminId = roleMap.get("admin");
        if (adminId) {
            for (const perm of permissions) {
                if (perm.name !== "roles.delete") {
                    if (isPostgres) {
                        await queryRunner.query(
                            `INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                            [adminId, perm.id]
                        );
                    } else {
                        await queryRunner.query(
                            `INSERT IGNORE INTO \`role_permissions\` (\`role_id\`, \`permission_id\`) VALUES (?, ?)`,
                            [adminId, perm.id]
                        );
                    }
                }
            }
        }

        // editor -> categories.*, articles.*, faqs.*
        const editorId = roleMap.get("editor");
        if (editorId) {
            for (const perm of permissions) {
                if (perm.name.startsWith("categories.") || perm.name.startsWith("articles.") || perm.name.startsWith("faqs.")) {
                    if (isPostgres) {
                        await queryRunner.query(
                            `INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                            [editorId, perm.id]
                        );
                    } else {
                        await queryRunner.query(
                            `INSERT IGNORE INTO \`role_permissions\` (\`role_id\`, \`permission_id\`) VALUES (?, ?)`,
                            [editorId, perm.id]
                        );
                    }
                }
            }
        }

        // author -> articles.view, articles.create
        const authorId = roleMap.get("author");
        if (authorId) {
            const authorPerms = ["articles.view", "articles.create"];
            for (const pName of authorPerms) {
                const pId = permMap.get(pName);
                if (pId) {
                    if (isPostgres) {
                        await queryRunner.query(
                            `INSERT INTO "role_permissions" ("role_id", "permission_id") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                            [authorId, pId]
                        );
                    } else {
                        await queryRunner.query(
                            `INSERT IGNORE INTO \`role_permissions\` (\`role_id\`, \`permission_id\`) VALUES (?, ?)`,
                            [authorId, pId]
                        );
                    }
                }
            }
        }

        // 8. Assign super_admin role to user 1 or admin@example.com if exists
        if (superAdminId) {
            if (isPostgres) {
                await queryRunner.query(
                    `UPDATE "users" SET "role_id" = $1 WHERE "id" = 1 OR "email" = 'admin@example.com'`,
                    [superAdminId]
                );
            } else {
                await queryRunner.query(
                    `UPDATE \`users\` SET \`role_id\` = ? WHERE \`id\` = 1 OR \`email\` = 'admin@example.com'`,
                    [superAdminId]
                );
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const isPostgres = queryRunner.connection.options.type === "postgres";

        if (isPostgres) {
            await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "FK_users_role"`);
            await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "role_id"`);
            await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`);
            await queryRunner.query(`DROP TABLE IF EXISTS "permissions"`);
            await queryRunner.query(`DROP TABLE IF EXISTS "roles"`);
        } else {
            const hasConstraint = await queryRunner.query(`
                SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND CONSTRAINT_NAME = 'FK_users_role'
            `);
            if (hasConstraint && hasConstraint.length > 0) {
                await queryRunner.query(`ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_users_role\``);
            }
            const hasRoleId = await queryRunner.hasColumn("users", "role_id");
            if (hasRoleId) {
                await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`role_id\``);
            }
            await queryRunner.query(`DROP TABLE IF EXISTS \`role_permissions\``);
            await queryRunner.query(`DROP TABLE IF EXISTS \`permissions\``);
            await queryRunner.query(`DROP TABLE IF EXISTS \`roles\``);
        }
    }
}
