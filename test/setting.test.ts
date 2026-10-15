import { describe, test, expect, beforeAll, afterAll, beforeEach } from "bun:test"
import { Hono } from "hono"
import {
    initTestDatabase,
    destroyTestDatabase,
    cleanTestDatabase,
    createTestApp,
    request,
    registerAndLogin,
} from "./setup"
import { AppDataSource } from "../src/config/database"
import { Role } from "../src/modules/rbac/entities/role.entity"
import { Permission } from "../src/modules/rbac/entities/permission.entity"
import { Setting } from "../src/modules/setting/entities/setting.entity"
import { User } from "../src/modules/user/entities/user.entity"

let app: Hono
let authHeaders: Record<string, string>

beforeAll(async () => {
    await initTestDatabase()
    app = createTestApp()
})

afterAll(async () => {
    await destroyTestDatabase()
})

beforeEach(async () => {
    await cleanTestDatabase()
    const session = await registerAndLogin(app)
    authHeaders = session.headers
})

// ═══════════════════════════════════════════════════════════════════════════
// Authentication & Authorization
// ═══════════════════════════════════════════════════════════════════════════

describe("Setting - Auth & RBAC", () => {
    test("GET /api/settings/public should be accessible without auth", async () => {
        const { status, body } = await request(app, "/api/settings/public")
        expect(status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.data).toHaveProperty("phone")
        expect(body.data).not.toHaveProperty("siteName")
        expect(body.data).not.toHaveProperty("metaKeywords")
        expect(body.data).not.toHaveProperty("ogImage")
    })

    test("GET /api/settings should fail without auth", async () => {
        const { status, body } = await request(app, "/api/settings")
        expect(status).toBe(401)
        expect(body.success).toBe(false)
    })

    test("PUT /api/settings should fail without auth", async () => {
        const { status, body } = await request(app, "/api/settings", {
            method: "PUT",
            body: { phone: "+62 812 0000 0000" },
        })
        expect(status).toBe(401)
        expect(body.success).toBe(false)
    })

    test("GET /api/settings should fail if user lacks settings.view permission", async () => {
        // Create user with role having no permissions
        const regRes = await request(app, "/api/auth/register", {
            method: "POST",
            body: { name: "No Perm User", email: "noperm@example.com", password: "password123" },
        })
        const roleRepo = AppDataSource.getRepository(Role)
        const emptyRole = await roleRepo.save(roleRepo.create({ name: "Empty Role", description: "No perms", permissions: [] }))
        const userRepo = AppDataSource.getRepository(User)
        await userRepo.update({ id: regRes.body.data.id }, { roleId: emptyRole.id })

        const loginRes = await request(app, "/api/auth/login", {
            method: "POST",
            body: { email: "noperm@example.com", password: "password123" },
        })

        const { status, body } = await request(app, "/api/settings", {
            headers: { Authorization: `Bearer ${loginRes.body.data.accessToken}` },
        })
        expect(status).toBe(403)
        expect(body.success).toBe(false)
    })

    test("PUT /api/settings should fail if user lacks settings.update permission", async () => {
        const regRes = await request(app, "/api/auth/register", {
            method: "POST",
            body: { name: "View Only User", email: "viewonly@example.com", password: "password123" },
        })
        const roleRepo = AppDataSource.getRepository(Role)
        const permRepo = AppDataSource.getRepository(Permission)
        // Find permission settings.view only
        const viewPerm = await permRepo.findOne({ where: { name: "settings.view" } })
        const viewRole = await roleRepo.save(roleRepo.create({
            name: "View Only Role",
            description: "View only",
            permissions: viewPerm ? [viewPerm] : [],
        }))
        const userRepo = AppDataSource.getRepository(User)
        await userRepo.update({ id: regRes.body.data.id }, { roleId: viewRole.id })

        const loginRes = await request(app, "/api/auth/login", {
            method: "POST",
            body: { email: "viewonly@example.com", password: "password123" },
        })

        const { status, body } = await request(app, "/api/settings", {
            method: "PUT",
            headers: { Authorization: `Bearer ${loginRes.body.data.accessToken}` },
            body: { phone: "+62 812 0000 0000" },
        })
        expect(status).toBe(403)
        expect(body.success).toBe(false)
    })

    test("GET /api/settings should succeed with granular settings.contact.view permission", async () => {
        const regRes = await request(app, "/api/auth/register", {
            method: "POST",
            body: { name: "Contact View User", email: "contactview@example.com", password: "password123" },
        })
        const roleRepo = AppDataSource.getRepository(Role)
        const permRepo = AppDataSource.getRepository(Permission)
        const contactViewPerm = await permRepo.findOne({ where: { name: "settings.contact.view" } })
        const contactViewRole = await roleRepo.save(roleRepo.create({
            name: "Contact View Role",
            description: "Meta view only",
            permissions: contactViewPerm ? [contactViewPerm] : [],
        }))
        const userRepo = AppDataSource.getRepository(User)
        await userRepo.update({ id: regRes.body.data.id }, { roleId: contactViewRole.id })

        const loginRes = await request(app, "/api/auth/login", {
            method: "POST",
            body: { email: "contactview@example.com", password: "password123" },
        })

        const { status, body } = await request(app, "/api/settings", {
            headers: { Authorization: `Bearer ${loginRes.body.data.accessToken}` },
        })
        expect(status).toBe(200)
        expect(body.success).toBe(true)
    })

    test("PUT /api/settings/social should succeed with settings.social.update but fail without it", async () => {
        const regRes = await request(app, "/api/auth/register", {
            method: "POST",
            body: { name: "Social Update User", email: "socialupdate@example.com", password: "password123" },
        })
        const roleRepo = AppDataSource.getRepository(Role)
        const permRepo = AppDataSource.getRepository(Permission)
        const socialUpdatePerm = await permRepo.findOne({ where: { name: "settings.social.update" } })
        const socialRole = await roleRepo.save(roleRepo.create({
            name: "Social Update Role",
            description: "Social update only",
            permissions: socialUpdatePerm ? [socialUpdatePerm] : [],
        }))
        const userRepo = AppDataSource.getRepository(User)
        await userRepo.update({ id: regRes.body.data.id }, { roleId: socialRole.id })

        const loginRes = await request(app, "/api/auth/login", {
            method: "POST",
            body: { email: "socialupdate@example.com", password: "password123" },
        })

        const updateRes = await request(app, "/api/settings/social", {
            method: "PUT",
            headers: { Authorization: `Bearer ${loginRes.body.data.accessToken}` },
            body: { instagram: "https://instagram.com/amti" },
        })
        expect(updateRes.status).toBe(200)
        expect(updateRes.body.success).toBe(true)

        const contactRes = await request(app, "/api/settings/contact", {
            method: "PUT",
            headers: { Authorization: `Bearer ${loginRes.body.data.accessToken}` },
            body: { phone: "+62 812 0000 0000" },
        })
        expect(contactRes.status).toBe(403)
        expect(contactRes.body.success).toBe(false)
    })

    test("PUT /api/settings/contact and /api/settings/social RBAC enforcement", async () => {
        const regRes = await request(app, "/api/auth/register", {
            method: "POST",
            body: { name: "Contact Social User", email: "contactsocial@example.com", password: "password123" },
        })
        const roleRepo = AppDataSource.getRepository(Role)
        const permRepo = AppDataSource.getRepository(Permission)
        const contactUpdatePerm = await permRepo.findOne({ where: { name: "settings.contact.update" } })
        const contactRole = await roleRepo.save(roleRepo.create({
            name: "Contact Only Role",
            description: "Contact only",
            permissions: contactUpdatePerm ? [contactUpdatePerm] : [],
        }))
        const userRepo = AppDataSource.getRepository(User)
        await userRepo.update({ id: regRes.body.data.id }, { roleId: contactRole.id })

        const loginRes = await request(app, "/api/auth/login", {
            method: "POST",
            body: { email: "contactsocial@example.com", password: "password123" },
        })

        const contactRes = await request(app, "/api/settings/contact", {
            method: "PUT",
            headers: { Authorization: `Bearer ${loginRes.body.data.accessToken}` },
            body: { phone: "+62 812 1111 2222" },
        })
        expect(contactRes.status).toBe(200)
        expect(contactRes.body.success).toBe(true)

        const socialRes = await request(app, "/api/settings/social", {
            method: "PUT",
            headers: { Authorization: `Bearer ${loginRes.body.data.accessToken}` },
            body: { facebook: "https://facebook.com/test" },
        })
        expect(socialRes.status).toBe(403)
        expect(socialRes.body.success).toBe(false)
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// Settings CRUD & Validation
// ═══════════════════════════════════════════════════════════════════════════

describe("Setting - Operations & Validation", () => {
    test("GET /api/settings should return settings with super admin", async () => {
        const { status, body } = await request(app, "/api/settings", {
            headers: authHeaders,
        })
        expect(status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.data).toHaveProperty("email")
        expect(body.data).not.toHaveProperty("siteDescription")
    })

    test("PUT /api/settings should update contact and social settings fields", async () => {
        const payload = {
            phone: "+62 812 9999 8888",
            email: "contact@amti.id",
            address: "Jl. Sudirman No. 1, Jakarta",
            facebook: "https://facebook.com/amti",
            instagram: "https://instagram.com/amti",
            tiktok: "https://tiktok.com/@amti",
            linkedin: "https://linkedin.com/company/amti",
            twitter: "https://x.com/amti",
            youtube: "https://youtube.com/@amti",
        }

        const { status, body } = await request(app, "/api/settings", {
            method: "PUT",
            headers: authHeaders,
            body: payload,
        })

        expect(status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.data.phone).toBe(payload.phone)
        expect(body.data.email).toBe(payload.email)
        expect(body.data.address).toBe(payload.address)
        expect(body.data.facebook).toBe(payload.facebook)
        expect(body.data.instagram).toBe(payload.instagram)
        expect(body.data.tiktok).toBe(payload.tiktok)
        expect(body.data.linkedin).toBe(payload.linkedin)
        expect(body.data.twitter).toBe(payload.twitter)
        expect(body.data.youtube).toBe(payload.youtube)
    })

    test("PUT /api/settings should fail validation with invalid email", async () => {
        const { status, body } = await request(app, "/api/settings", {
            method: "PUT",
            headers: authHeaders,
            body: {
                email: "invalid-email-string",
            },
        })

        expect(status).toBe(422)
        expect(body.success).toBe(false)
    })

    test("PUT /api/settings should ignore retired metadata fields", async () => {
        const { status, body } = await request(app, "/api/settings", {
            method: "PUT",
            headers: authHeaders,
            body: {
                siteName: "Changed site",
                siteDescription: "Changed description",
                metaKeywords: "changed",
                logo: "uploads/new-logo.png",
                ogImage: "uploads/new-og.png",
                phone: "+62 811 0000 0000",
            },
        })
        expect(status).toBe(200)
        expect(body.data.phone).toBe("+62 811 0000 0000")
        expect(body.data).not.toHaveProperty("siteName")
        expect(body.data).not.toHaveProperty("logo")
        const setting = await AppDataSource.getRepository(Setting).findOneByOrFail({ id: body.data.id })
        expect(setting.siteName).toBe("AMTI")
        expect(setting.siteDescription).toBeNull()
        expect(setting.metaKeywords).toBeNull()
        expect(setting.logo).toBeNull()
        expect(setting.ogImage).toBeNull()
    })

    test("PUT /api/settings/meta should no longer exist", async () => {
        const { status } = await request(app, "/api/settings/meta", {
            method: "PUT",
            headers: authHeaders,
            body: { siteName: "AMTI Meta Update" },
        })
        expect(status).toBe(404)
    })

    test("PUT /api/settings/contact should update contact fields specifically", async () => {
        const contactPayload = {
            phone: "+62 811 2222 3333",
            email: "contact-new@amti.id",
            address: "Jakarta Selatan, Indonesia",
        }

        const { status, body } = await request(app, "/api/settings/contact", {
            method: "PUT",
            headers: authHeaders,
            body: contactPayload,
        })

        expect(status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.data.phone).toBe(contactPayload.phone)
        expect(body.data.email).toBe(contactPayload.email)
        expect(body.data.address).toBe(contactPayload.address)
    })

    test("PUT /api/settings/social should update social media fields specifically", async () => {
        const socialPayload = {
            facebook: "https://facebook.com/new-amti",
            instagram: "https://instagram.com/new-amti",
            tiktok: "https://tiktok.com/@new-amti",
            linkedin: "https://linkedin.com/company/new-amti",
            twitter: "https://x.com/new-amti",
            youtube: "https://youtube.com/@new-amti",
        }

        const { status, body } = await request(app, "/api/settings/social", {
            method: "PUT",
            headers: authHeaders,
            body: socialPayload,
        })

        expect(status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.data.facebook).toBe(socialPayload.facebook)
        expect(body.data.instagram).toBe(socialPayload.instagram)
        expect(body.data.tiktok).toBe(socialPayload.tiktok)
        expect(body.data.linkedin).toBe(socialPayload.linkedin)
        expect(body.data.twitter).toBe(socialPayload.twitter)
        expect(body.data.youtube).toBe(socialPayload.youtube)
    })
})
