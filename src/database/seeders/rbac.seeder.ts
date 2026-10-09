import "reflect-metadata"
import { DataSource } from "typeorm"
import { AppDataSource } from "../../config/database"
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
]

export const defaultRoles = [
    {
        name: "super_admin",
        displayName: "Super Admin",
        description: "Full system access with all permissions",
        isSystem: true,
        permissions: defaultPermissions.map(p => p.name),
    },
    {
        name: "admin",
        displayName: "Admin",
        description: "Administrative access for users, content, and faqs",
        isSystem: false,
        permissions: defaultPermissions.filter(p => p.name !== "roles.delete").map(p => p.name),
    },
    {
        name: "editor",
        displayName: "Editor",
        description: "Can manage articles, categories, and faqs",
        isSystem: false,
        permissions: defaultPermissions
            .filter(p => p.name.startsWith("categories.") || p.name.startsWith("articles.") || p.name.startsWith("faqs.") || p.name === "users.view")
            .map(p => p.name),
    },
    {
        name: "author",
        displayName: "Author",
        description: "Can create and view articles",
        isSystem: false,
        permissions: ["articles.view", "articles.create", "categories.view"],
    },
]

export async function seedRbac(ds: DataSource) {
    const permRepo = ds.getRepository(Permission)
    const roleRepo = ds.getRepository(Role)

    console.log("Seeding RBAC permissions...")
    for (const permData of defaultPermissions) {
        let perm = await permRepo.findOne({ where: { name: permData.name } })
        if (!perm) {
            perm = permRepo.create(permData)
            await permRepo.save(perm)
            console.log(`  + Permission created: ${perm.name}`)
        } else {
            perm.module = permData.module
            perm.description = permData.description
            await permRepo.save(perm)
        }
    }

    const allPerms = await permRepo.find()
    const permMap = new Map(allPerms.map(p => [p.name, p]))

    console.log("Seeding RBAC roles...")
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
                displayName: roleData.displayName,
                description: roleData.description,
                isSystem: roleData.isSystem,
                permissions: rolePerms,
            })
            await roleRepo.save(role)
            console.log(`  + Role created: ${role.displayName} (${rolePerms.length} perms)`)
        } else {
            role.displayName = roleData.displayName
            role.description = roleData.description
            role.isSystem = roleData.isSystem
            role.permissions = rolePerms
            await roleRepo.save(role)
            console.log(`  ~ Role updated: ${role.displayName} (${rolePerms.length} perms)`)
        }
    }

    console.log("RBAC seeding complete.\n")
}

// Standalone execution
if (import.meta.main) {
    AppDataSource.initialize()
        .then(async (ds) => {
            console.log("Connected to database")
            await seedRbac(ds)
            await ds.destroy()
        })
        .catch((err) => {
            console.error("RBAC seeder failed:", err)
            process.exit(1)
        })
}
