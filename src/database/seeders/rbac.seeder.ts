import "reflect-metadata"
import { DataSource } from "typeorm"
import { AppDataSource } from "../../config/database"
import { logger } from "../../core/helpers/logger"
import { Permission } from "../../modules/rbac/entities/permission.entity"
import { Role } from "../../modules/rbac/entities/role.entity"

export const defaultPermissions = [
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
    // Settings
    { name: "settings.view", module: "Settings", description: "View system settings" },
    { name: "settings.update", module: "Settings", description: "Update system settings" },
    { name: "settings.contact.view", module: "Settings", description: "View contact information settings" },
    { name: "settings.contact.update", module: "Settings", description: "Update contact information settings" },
    { name: "settings.social.view", module: "Settings", description: "View social media settings" },
    { name: "settings.social.update", module: "Settings", description: "Update social media settings" },
    // Messages
    { name: "messages.view", module: "Messages", description: "View contact messages and inquiries" },
    { name: "messages.update", module: "Messages", description: "Update message status (read/unread)" },
    { name: "messages.delete", module: "Messages", description: "Delete messages" },
    // Clients
    { name: "clients.view", module: "Clients", description: "View clients list and details" },
    { name: "clients.create", module: "Clients", description: "Create new client" },
    { name: "clients.update", module: "Clients", description: "Update existing client" },
    { name: "clients.delete", module: "Clients", description: "Delete client" },
    // Live Chat
    { name: "livechat.view", module: "Live Chat", description: "View live chat tickets and messages" },
    { name: "livechat.claim", module: "Live Chat", description: "Claim visitor chat tickets" },
    { name: "livechat.reply", module: "Live Chat", description: "Reply to visitor chat messages" },
    { name: "livechat.resolve", module: "Live Chat", description: "Resolve and close chat tickets" },
]

export const defaultRoles = [
    {
        name: "Super Admin",
        description: "Full system access with all permissions",
        permissions: defaultPermissions.map(p => p.name),
    },
    {
        name: "Admin",
        description: "Administrative access for users, content, and faqs",
        permissions: defaultPermissions.filter(p => p.name !== "roles.delete").map(p => p.name),
    },
    {
        name: "Editor",
        description: "Can manage articles, categories, and faqs",
        permissions: defaultPermissions
            .filter(p => p.name.startsWith("categories.") || p.name.startsWith("articles.") || p.name.startsWith("faqs.") || p.name === "users.view")
            .map(p => p.name),
    },
    {
        name: "Author",
        description: "Can create and view articles",
        permissions: ["articles.view", "articles.create", "categories.view"],
    },
]

export async function seedRbac(ds: DataSource) {
    const permRepo = ds.getRepository(Permission)
    const roleRepo = ds.getRepository(Role)

    logger.info("Seeding RBAC permissions...")
    for (const permData of defaultPermissions) {
        let perm = await permRepo.findOne({ where: { name: permData.name } })
        if (!perm) {
            perm = permRepo.create(permData)
            await permRepo.save(perm)
            logger.info("Permission created", { name: perm.name })
        } else {
            perm.module = permData.module
            perm.description = permData.description
            await permRepo.save(perm)
        }
    }

    const allPerms = await permRepo.find()
    const permMap = new Map(allPerms.map(p => [p.name, p]))

    logger.info("Seeding RBAC roles...")
    for (const roleData of defaultRoles) {
        let role = await roleRepo.findOne({
            where: { name: roleData.name },
            relations: ["permissions"],
        })

        const rolePerms = roleData.permissions
            .map(pName => permMap.get(pName))
            .filter((p): p is Permission => !!p)

        if (!role) {
            role = roleRepo.create({
                name: roleData.name,
                description: roleData.description,
                permissions: rolePerms,
            })
            await roleRepo.save(role)
            logger.info("Role created", { name: role.name, permissions: rolePerms.length })
        } else {
            role.description = roleData.description
            role.permissions = rolePerms
            await roleRepo.save(role)
            logger.info("Role updated", { name: role.name, permissions: rolePerms.length })
        }
    }

    logger.info("RBAC seeding complete")
}

// Standalone execution
if (import.meta.main) {
    AppDataSource.initialize()
        .then(async (ds) => {
            logger.info("Connected to database")
            await seedRbac(ds)
            await ds.destroy()
        })
        .catch((err) => {
            logger.error("RBAC seeder failed", { err })
            process.exit(1)
        })
}
