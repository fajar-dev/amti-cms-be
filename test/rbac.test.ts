import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test"
import { Hono } from "hono"
import { initTestDatabase, destroyTestDatabase, cleanTestDatabase, createTestApp, request } from "./setup"
import { createUserData, createRoleData, resetCounters, expectSuccess, expectError } from "./helpers"
import { AppDataSource } from "../src/config/database"
import { Role } from "../src/modules/rbac/entities/role.entity"
import { Permission } from "../src/modules/rbac/entities/permission.entity"

let app: Hono
let authToken: string
let adminUser: any

// Helper to seed initial permissions & roles into test database
async function seedRbacTestData() {
    const permRepo = AppDataSource.getRepository(Permission)
    const roleRepo = AppDataSource.getRepository(Role)

    const permissions = [
        { name: "users.view", module: "Users", description: "View users" },
        { name: "users.create", module: "Users", description: "Create users" },
        { name: "users.update", module: "Users", description: "Update users" },
        { name: "users.delete", module: "Users", description: "Delete users" },
        { name: "roles.view", module: "Roles & Permissions", description: "View roles" },
        { name: "roles.create", module: "Roles & Permissions", description: "Create roles" },
        { name: "roles.update", module: "Roles & Permissions", description: "Update roles" },
        { name: "roles.delete", module: "Roles & Permissions", description: "Delete roles" },
        { name: "articles.view", module: "Articles", description: "View articles" },
        { name: "articles.create", module: "Articles", description: "Create articles" },
    ]

    const savedPerms = await permRepo.save(permissions)

    const superAdminRole = roleRepo.create({
        name: "Super Admin",
        description: "Full system access",
        permissions: savedPerms,
    })
    await roleRepo.save(superAdminRole)

    const authorRole = roleRepo.create({
        name: "Author",
        description: "Can only view and create articles",
        permissions: savedPerms.filter(p => p.name.startsWith("articles.")),
    })
    await roleRepo.save(authorRole)
}

beforeAll(async () => {
    await initTestDatabase()
    app = createTestApp()
})

afterAll(async () => {
    await destroyTestDatabase()
})

beforeEach(async () => {
    await cleanTestDatabase()
    resetCounters()
    await seedRbacTestData()

    // Create & authenticate super admin user
    const userData = createUserData()
    const regRes = await request(app, "/api/auth/register", {
        method: "POST",
        body: userData,
    })
    adminUser = regRes.body.data

    // Assign Super Admin role to adminUser
    const roleRepo = AppDataSource.getRepository(Role)
    const superAdminRole = await roleRepo.findOneBy({ name: "Super Admin" })
    if (superAdminRole) {
        const userRepo = AppDataSource.getRepository("User")
        await userRepo.update(adminUser.id, { roleId: superAdminRole.id })
    }

    const loginRes = await request(app, "/api/auth/login", {
        method: "POST",
        body: { email: userData.email, password: userData.password },
    })
    authToken = loginRes.body.data.accessToken
})

describe("RBAC - Permissions & Roles", () => {
    test("GET /api/rbac/permissions should return all permissions flat and grouped", async () => {
        const { status, body } = await request(app, "/api/rbac/permissions", {
            token: authToken,
        })

        expect(status).toBe(200)
        expectSuccess(body)
        expect(body.data.flat).toBeInstanceOf(Array)
        expect(body.data.flat.length).toBeGreaterThanOrEqual(10)
        expect(body.data.grouped).toBeDefined()
        expect(body.data.grouped["Users"]).toBeInstanceOf(Array)
        expect(body.data.grouped["Roles & Permissions"]).toBeInstanceOf(Array)
    })

    test("GET /api/rbac/roles/all should return unpaginated roles list", async () => {
        const { status, body } = await request(app, "/api/rbac/roles/all", {
            token: authToken,
        })

        expect(status).toBe(200)
        expectSuccess(body)
        expect(body.data).toBeInstanceOf(Array)
        expect(body.data.length).toBeGreaterThanOrEqual(2)
        expect(body.data[0].id).toBeDefined()
        expect(body.data[0].name).toBeDefined()
    })

    test("GET /api/rbac/roles should return paginated roles", async () => {
        const { status, body } = await request(app, "/api/rbac/roles?page=1&limit=10", {
            token: authToken,
        })

        expect(status).toBe(200)
        expectSuccess(body)
        expect(body.data).toBeInstanceOf(Array)
        expect(body.meta.total).toBeGreaterThanOrEqual(2)
        expect(body.data[0].permissions).toBeDefined()
        expect(body.data[0].permissionCount).toBeDefined()
        expect(body.data[0].userCount).toBeDefined()
    })

    test("POST /api/rbac/roles should create a new custom role with permissions", async () => {
        const permRes = await request(app, "/api/rbac/permissions", { token: authToken })
        const permIds = permRes.body.data.flat.slice(0, 3).map((p: any) => p.id)

        const roleData = createRoleData({
            name: "Support Lead",
            description: "Handles customer queries",
            permissionIds: permIds,
        })

        const { status, body } = await request(app, "/api/rbac/roles", {
            method: "POST",
            token: authToken,
            body: roleData,
        })

        expect(status).toBe(201)
        expectSuccess(body, 201)
        expect(body.data.name).toBe("Support Lead")
        expect(body.data.permissions.length).toBe(3)
    })

    test("POST /api/rbac/roles should fail validation if role name is duplicate", async () => {
        const roleData = createRoleData({
            name: "Super Admin",
        })

        const { status, body } = await request(app, "/api/rbac/roles", {
            method: "POST",
            token: authToken,
            body: roleData,
        })

        expect(status).toBe(400)
        expectError(body, 400)
        expect(body.message).toContain("already exists")
    })

    test("GET /api/rbac/roles/:id should retrieve single role details", async () => {
        const roleRepo = AppDataSource.getRepository(Role)
        const role = await roleRepo.findOneBy({ name: "Super Admin" })

        const { status, body } = await request(app, `/api/rbac/roles/${role!.id}`, {
            token: authToken,
        })

        expect(status).toBe(200)
        expectSuccess(body)
        expect(body.data.id).toBe(role!.id)
        expect(body.data.name).toBe("Super Admin")
        expect(body.data.permissions.length).toBeGreaterThan(0)
    })

    test("PUT /api/rbac/roles/:id should update role name and permissions", async () => {
        const roleRepo = AppDataSource.getRepository(Role)
        const authorRole = await roleRepo.findOneBy({ name: "Author" })
        const permRes = await request(app, "/api/rbac/permissions", { token: authToken })
        const allPermIds = permRes.body.data.flat.map((p: any) => p.id)

        const { status, body } = await request(app, `/api/rbac/roles/${authorRole!.id}`, {
            method: "PUT",
            token: authToken,
            body: {
                name: "Senior Author",
                description: "Updated description",
                permissionIds: allPermIds,
            },
        })

        expect(status).toBe(200)
        expectSuccess(body)
        expect(body.data.name).toBe("Senior Author")
        expect(body.data.description).toBe("Updated description")
        expect(body.data.permissions.length).toBe(allPermIds.length)
    })

    test("PUT /api/rbac/roles/:id should prevent duplicate role name", async () => {
        const roleRepo = AppDataSource.getRepository(Role)

        // Create another role
        const otherRole = await roleRepo.save(roleRepo.create({ name: "Unique Role" }))

        const { status, body } = await request(app, `/api/rbac/roles/${otherRole.id}`, {
            method: "PUT",
            token: authToken,
            body: {
                name: "Super Admin",
            },
        })

        expect(status).toBe(400)
        expectError(body, 400)
        expect(body.message).toContain("already in use")
    })

    test("DELETE /api/rbac/roles/:id should prevent deleting a role assigned to users", async () => {
        const roleRepo = AppDataSource.getRepository(Role)
        const authorRole = await roleRepo.findOneBy({ name: "Author" })

        // Create a user assigned to author role
        const newUser = createUserData()
        const userRes = await request(app, "/api/user", {
            method: "POST",
            token: authToken,
            body: { ...newUser, roleId: authorRole!.id },
        })
        expect(userRes.status).toBe(201)

        const { status, body } = await request(app, `/api/rbac/roles/${authorRole!.id}`, {
            method: "DELETE",
            token: authToken,
        })

        expect(status).toBe(400)
        expectError(body, 400)
        expect(body.message).toContain("assigned to")
    })

    test("DELETE /api/rbac/roles/:id should successfully delete unused role", async () => {
        const createRes = await request(app, "/api/rbac/roles", {
            method: "POST",
            token: authToken,
            body: { name: "Temporary Role" },
        })
        const createdId = createRes.body.data.id

        const { status, body } = await request(app, `/api/rbac/roles/${createdId}`, {
            method: "DELETE",
            token: authToken,
        })

        expect(status).toBe(200)
        expectSuccess(body)

        // Verify it is gone
        const getRes = await request(app, `/api/rbac/roles/${createdId}`, {
            token: authToken,
        })
        expect(getRes.status).toBe(404)
    })
})

describe("RBAC - Access Control Enforcement", () => {
    test("User with author role should be forbidden from accessing /api/rbac/roles", async () => {
        const roleRepo = AppDataSource.getRepository(Role)
        const authorRole = await roleRepo.findOneBy({ name: "Author" })

        // Register and login an author user
        const authorData = createUserData()
        await request(app, "/api/auth/register", {
            method: "POST",
            body: authorData,
        })

        // Assign author role
        const userRepo = AppDataSource.getRepository("User")
        await userRepo.update({ email: authorData.email }, { roleId: authorRole!.id })

        const loginRes = await request(app, "/api/auth/login", {
            method: "POST",
            body: { email: authorData.email, password: authorData.password },
        })
        const authorToken = loginRes.body.data.accessToken

        // Try to access /api/rbac/roles
        const { status, body } = await request(app, "/api/rbac/roles", {
            token: authorToken,
        })

        expect(status).toBe(403)
        expectError(body, 403)
        expect(body.message).toContain("permission")
    })

    test("User create and update with roleId returns role in response", async () => {
        const roleRepo = AppDataSource.getRepository(Role)
        const authorRole = await roleRepo.findOneBy({ name: "Author" })

        const newUserData = createUserData()
        const createRes = await request(app, "/api/user", {
            method: "POST",
            token: authToken,
            body: { ...newUserData, roleId: authorRole!.id },
        })

        expect(createRes.status).toBe(201)
        expect(createRes.body.data.role).toBeDefined()
        expect(createRes.body.data.role.id).toBe(authorRole!.id)
        expect(createRes.body.data.role.name).toBe("Author")

        const userId = createRes.body.data.id

        // Update to remove role (roleId: null)
        const updateRes = await request(app, `/api/user/${userId}`, {
            method: "PUT",
            token: authToken,
            body: { roleId: null },
        })

        expect(updateRes.status).toBe(200)
        expect(updateRes.body.data.role).toBeNull()
    })
})
