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
import { User } from "../src/modules/user/entities/user.entity"
import { Message } from "../src/modules/message/entities/message.entity"

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
// Public Message Submission
// ═══════════════════════════════════════════════════════════════════════════

describe("Message - Public Submission", () => {
    test("POST /api/messages should create message without authentication", async () => {
        const payload = {
            name: "John Doe",
            email: "john@example.com",
            phone: "+6281234567890",
            subject: "Product Inquiry",
            message: "Hello, I want to know more about your services.",
        }

        const { status, body } = await request(app, "/api/messages", {
            method: "POST",
            body: payload,
        })

        expect(status).toBe(201)
        expect(body.success).toBe(true)
        expect(body.data.id).toBeDefined()
        expect(body.data.name).toBe(payload.name)
        expect(body.data.email).toBe(payload.email)
        expect(body.data.phone).toBe(payload.phone)
        expect(body.data.subject).toBe(payload.subject)
        expect(body.data.message).toBe(payload.message)
        expect(body.data.isRead).toBe(false)
    })

    test("POST /api/messages should succeed with null phone", async () => {
        const payload = {
            name: "Jane Doe",
            email: "jane@example.com",
            subject: "Collaboration",
            message: "Interested in partnership.",
        }

        const { status, body } = await request(app, "/api/messages", {
            method: "POST",
            body: payload,
        })

        expect(status).toBe(201)
        expect(body.success).toBe(true)
        expect(body.data.phone).toBeNull()
        expect(body.data.isRead).toBe(false)
    })

    test("POST /api/messages should fail validation when required fields are missing", async () => {
        const { status, body } = await request(app, "/api/messages", {
            method: "POST",
            body: {
                name: "",
                email: "not-an-email",
                subject: "",
                message: "",
            },
        })

        expect(status).toBe(422)
        expect(body.success).toBe(false)
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// Admin Operations & RBAC
// ═══════════════════════════════════════════════════════════════════════════

describe("Message - Admin & RBAC", () => {
    test("GET /api/messages should fail without auth", async () => {
        const { status } = await request(app, "/api/messages")
        expect(status).toBe(401)
    })

    test("GET /api/messages should fail without messages.view permission", async () => {
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

        const { status } = await request(app, "/api/messages", {
            headers: { Authorization: `Bearer ${loginRes.body.data.accessToken}` },
        })
        expect(status).toBe(403)
    })

    test("GET /api/messages should retrieve paginated list and filter by isRead", async () => {
        const msgRepo = AppDataSource.getRepository(Message)
        await msgRepo.save([
            msgRepo.create({ name: "User 1", email: "u1@test.com", subject: "Subject 1", message: "Msg 1", isRead: false }),
            msgRepo.create({ name: "User 2", email: "u2@test.com", subject: "Subject 2", message: "Msg 2", isRead: true }),
            msgRepo.create({ name: "Special Person", email: "sp@test.com", subject: "Important", message: "Urgent issue", isRead: false }),
        ])

        // All messages
        const resAll = await request(app, "/api/messages", { headers: authHeaders })
        expect(resAll.status).toBe(200)
        expect(resAll.body.success).toBe(true)
        expect(resAll.body.data.length).toBe(3)
        expect(resAll.body.meta.total).toBe(3)

        // Filter unread only
        const resUnread = await request(app, "/api/messages?isRead=false", { headers: authHeaders })
        expect(resUnread.status).toBe(200)
        expect(resUnread.body.data.length).toBe(2)

        // Filter read only
        const resRead = await request(app, "/api/messages?isRead=true", { headers: authHeaders })
        expect(resRead.status).toBe(200)
        expect(resRead.body.data.length).toBe(1)
        expect(resRead.body.data[0].email).toBe("u2@test.com")

        // Search by keyword
        const resSearch = await request(app, "/api/messages?q=Special", { headers: authHeaders })
        expect(resSearch.status).toBe(200)
        expect(resSearch.body.data.length).toBe(1)
        expect(resSearch.body.data[0].name).toBe("Special Person")
    })

    test("GET /api/messages/:id should retrieve message details", async () => {
        const msgRepo = AppDataSource.getRepository(Message)
        const saved = await msgRepo.save(msgRepo.create({
            name: "John Detail",
            email: "detail@test.com",
            phone: "0812345",
            subject: "Feedback",
            message: "Great service!",
            isRead: false,
        }))

        const { status, body } = await request(app, `/api/messages/${saved.id}`, { headers: authHeaders })
        expect(status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.data.id).toBe(saved.id)
        expect(body.data.name).toBe("John Detail")
    })

    test("GET /api/messages/:id should return 404 for non-existent message", async () => {
        const { status, body } = await request(app, "/api/messages/9999", { headers: authHeaders })
        expect(status).toBe(404)
        expect(body.success).toBe(false)
    })

    test("PUT and PATCH /api/messages/:id/read should update read status", async () => {
        const msgRepo = AppDataSource.getRepository(Message)
        const saved = await msgRepo.save(msgRepo.create({
            name: "Status Test",
            email: "status@test.com",
            subject: "Check Read",
            message: "Hello world",
            isRead: false,
        }))

        // Mark as read via PUT
        const putRes = await request(app, `/api/messages/${saved.id}/read`, {
            method: "PUT",
            headers: authHeaders,
            body: { isRead: true },
        })
        expect(putRes.status).toBe(200)
        expect(putRes.body.success).toBe(true)
        expect(putRes.body.data.isRead).toBe(true)

        // Mark back as unread via PATCH
        const patchRes = await request(app, `/api/messages/${saved.id}/read`, {
            method: "PATCH",
            headers: authHeaders,
            body: { isRead: false },
        })
        expect(patchRes.status).toBe(200)
        expect(patchRes.body.success).toBe(true)
        expect(patchRes.body.data.isRead).toBe(false)
    })

    test("DELETE /api/messages/:id should delete message", async () => {
        const msgRepo = AppDataSource.getRepository(Message)
        const saved = await msgRepo.save(msgRepo.create({
            name: "Delete Me",
            email: "delete@test.com",
            subject: "Spam",
            message: "Spam message",
        }))

        const delRes = await request(app, `/api/messages/${saved.id}`, {
            method: "DELETE",
            headers: authHeaders,
        })
        expect(delRes.status).toBe(200)
        expect(delRes.body.success).toBe(true)

        // Verify gone
        const checkRes = await request(app, `/api/messages/${saved.id}`, { headers: authHeaders })
        expect(checkRes.status).toBe(404)
    })

    test("DELETE /api/messages/:id should fail if user lacks messages.delete permission", async () => {
        const msgRepo = AppDataSource.getRepository(Message)
        const saved = await msgRepo.save(msgRepo.create({
            name: "Delete Protect",
            email: "protect@test.com",
            subject: "Keep",
            message: "Do not delete",
        }))

        const regRes = await request(app, "/api/auth/register", {
            method: "POST",
            body: { name: "View Only", email: "viewonlymsg@example.com", password: "password123" },
        })
        const roleRepo = AppDataSource.getRepository(Role)
        const permRepo = AppDataSource.getRepository(Permission)
        const viewPerm = await permRepo.findOne({ where: { name: "messages.view" } })
        const viewRole = await roleRepo.save(roleRepo.create({
            name: "Messages View Only",
            description: "View only",
            permissions: viewPerm ? [viewPerm] : [],
        }))
        const userRepo = AppDataSource.getRepository(User)
        await userRepo.update({ id: regRes.body.data.id }, { roleId: viewRole.id })

        const loginRes = await request(app, "/api/auth/login", {
            method: "POST",
            body: { email: "viewonlymsg@example.com", password: "password123" },
        })

        const delRes = await request(app, `/api/messages/${saved.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${loginRes.body.data.accessToken}` },
        })
        expect(delRes.status).toBe(403)
        expect(delRes.body.success).toBe(false)
    })
})
