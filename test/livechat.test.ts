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
// Public Live Chat (Visitor Flow)
// ═══════════════════════════════════════════════════════════════════════════

describe("Live Chat - Public Visitor API", () => {
    test("POST /api/public/livechat/start should validate required lead capture fields", async () => {
        const { status, body } = await request(app, "/api/public/livechat/start", {
            method: "POST",
            body: {
                visitorName: "Budi",
                // missing email, phone, company
            },
        })

        expect(status).toBe(422)
        expect(body.success).toBe(false)
    })

    test("POST /api/public/livechat/start should start session with initial message", async () => {
        const { status, body } = await request(app, "/api/public/livechat/start", {
            method: "POST",
            body: {
                visitorName: "Budi Santoso",
                visitorEmail: "budi@perusahaan.com",
                visitorPhone: "081234567890",
                visitorCompany: "PT Maju Terus",
                initialMessage: "Halo, saya tertarik dengan sistem EEWS.",
            },
        })

        expect(status).toBe(201)
        expect(body.success).toBe(true)
        expect(body.data.session.ticketNumber).toBeDefined()
        expect(body.data.session.sessionToken).toBeDefined()
        expect(body.data.session.visitorCompany).toBe("PT Maju Terus")
        expect(body.data.session.status).toBe("WAITING")
        expect(body.data.message).toBeDefined()
        expect(body.data.message.message).toBe("Halo, saya tertarik dengan sistem EEWS.")
    })

    test("GET /api/public/livechat/session should retrieve session status using token", async () => {
        const startRes = await request(app, "/api/public/livechat/start", {
            method: "POST",
            body: {
                visitorName: "Dewi",
                visitorEmail: "dewi@konstruksi.co.id",
                visitorPhone: "081298765432",
                visitorCompany: "PT Konstruksi Nusantara",
            },
        })

        const token = startRes.body.data.session.sessionToken

        const { status, body } = await request(app, "/api/public/livechat/session", {
            headers: { "X-Session-Token": token },
        })

        expect(status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.data.visitorName).toBe("Dewi")
        expect(body.data.status).toBe("WAITING")
    })

    test("POST /api/public/livechat/messages should allow visitor to send message with media", async () => {
        const startRes = await request(app, "/api/public/livechat/start", {
            method: "POST",
            body: {
                visitorName: "Andi",
                visitorEmail: "andi@tambang.com",
                visitorPhone: "08111222333",
                visitorCompany: "PT Tambang Makmur",
            },
        })

        const token = startRes.body.data.session.sessionToken

        const { status, body } = await request(app, "/api/public/livechat/messages", {
            method: "POST",
            headers: { "X-Session-Token": token },
            body: {
                message: "Ini denah lokasi sensor tambang.",
                mediaUrl: "chat-media/denah.png",
                mediaType: "image/png",
                mediaName: "denah.png",
                mediaSize: 102400,
            },
        })

        expect(status).toBe(201)
        expect(body.success).toBe(true)
        expect(body.data.message).toBe("Ini denah lokasi sensor tambang.")
        expect(body.data.mediaUrl).toContain("denah.png")
        expect(body.data.senderType).toBe("VISITOR")
    })

    test("GET /api/public/livechat/messages should return full message history", async () => {
        const startRes = await request(app, "/api/public/livechat/start", {
            method: "POST",
            body: {
                visitorName: "Rudi",
                visitorEmail: "rudi@bumn.co.id",
                visitorPhone: "081333444555",
                visitorCompany: "PT Jembatan Indonesia",
                initialMessage: "Pertanyaan 1",
            },
        })

        const token = startRes.body.data.session.sessionToken

        await request(app, "/api/public/livechat/messages", {
            method: "POST",
            headers: { "X-Session-Token": token },
            body: { message: "Pertanyaan 2" },
        })

        const { status, body } = await request(app, "/api/public/livechat/messages", {
            headers: { "X-Session-Token": token },
        })

        expect(status).toBe(200)
        expect(body.data.messages.length).toBe(2)
        expect(body.data.messages[0].message).toBe("Pertanyaan 1")
        expect(body.data.messages[1].message).toBe("Pertanyaan 2")
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// Staff / CMS Operations (Claim Ticket & Reply)
// ═══════════════════════════════════════════════════════════════════════════

describe("Live Chat - Staff CMS API", () => {
    test("Staff endpoints should require authentication", async () => {
        const { status: listStatus } = await request(app, "/api/livechat/tickets")
        expect(listStatus).toBe(401)

        const { status: claimStatus } = await request(app, "/api/livechat/tickets/1/claim", {
            method: "POST",
        })
        expect(claimStatus).toBe(401)
    })

    test("Staff should see tickets in waiting queue and view stats", async () => {
        // Visitor creates ticket
        await request(app, "/api/public/livechat/start", {
            method: "POST",
            body: {
                visitorName: "Customer A",
                visitorEmail: "cust@a.com",
                visitorPhone: "08120000001",
                visitorCompany: "PT Alfa",
                initialMessage: "Butuh penawaran",
            },
        })

        // Check stats
        const { status: statsStatus, body: statsBody } = await request(app, "/api/livechat/tickets/stats", {
            headers: authHeaders,
        })
        expect(statsStatus).toBe(200)
        expect(statsBody.data.waiting).toBe(1)

        // List tickets
        const { status: listStatus, body: listBody } = await request(app, "/api/livechat/tickets?status=WAITING", {
            headers: authHeaders,
        })
        expect(listStatus).toBe(200)
        expect(listBody.data.length).toBe(1)
        expect(listBody.data[0].visitorCompany).toBe("PT Alfa")
    })

    test("Staff should claim ticket, exchange messages, and resolve", async () => {
        // Visitor creates ticket
        const startRes = await request(app, "/api/public/livechat/start", {
            method: "POST",
            body: {
                visitorName: "Pak Hendra",
                visitorEmail: "hendra@infra.com",
                visitorPhone: "081999888777",
                visitorCompany: "PT Infrastruktur Jaya",
                initialMessage: "Halo, mohon bantuan teknis.",
            },
        })
        const ticketId = startRes.body.data.session.id
        const visitorToken = startRes.body.data.session.sessionToken

        // Staff claims ticket
        const { status: claimStatus, body: claimBody } = await request(app, `/api/livechat/tickets/${ticketId}/claim`, {
            method: "POST",
            headers: authHeaders,
        })
        expect(claimStatus).toBe(200)
        expect(claimBody.data.status).toBe("IN_PROGRESS")
        expect(claimBody.data.assignedToId).toBeDefined()

        // Staff replies with message and media
        const { status: replyStatus, body: replyBody } = await request(app, `/api/livechat/tickets/${ticketId}/messages`, {
            method: "POST",
            headers: authHeaders,
            body: {
                message: "Halo Pak Hendra, saya siap membantu. Berikut katalog SHMS kami.",
                mediaUrl: "chat-media/katalog.pdf",
                mediaType: "application/pdf",
                mediaName: "katalog-shms.pdf",
                mediaSize: 204800,
            },
        })
        expect(replyStatus).toBe(201)
        expect(replyBody.data.senderType).toBe("USER")
        expect(replyBody.data.mediaUrl).toContain("katalog.pdf")

        // Visitor views messages and sees system claim + staff reply
        const { body: visitorHistory } = await request(app, "/api/public/livechat/messages", {
            headers: { "X-Session-Token": visitorToken },
        })
        expect(visitorHistory.data.messages.length).toBe(3) // 1 initial + 1 system join + 1 staff reply
        expect(visitorHistory.data.session.status).toBe("IN_PROGRESS")

        // Staff resolves ticket
        const { status: resolveStatus, body: resolveBody } = await request(app, `/api/livechat/tickets/${ticketId}/resolve`, {
            method: "POST",
            headers: authHeaders,
        })
        expect(resolveStatus).toBe(200)
        expect(resolveBody.data.status).toBe("RESOLVED")
    })
})

describe("Live Chat - Regression coverage", () => {
    async function startSession() {
        const { createChatData } = await import("./helpers")
        const response = await request(app, "/api/public/livechat/start", {
            method: "POST", body: createChatData()
        })
        expect(response.status).toBe(201)
        return response.body.data.session
    }

    test("invalid visitor token cannot upload media", async () => {
        const form = new FormData()
        form.set("file", new File(["attachment"], "test.txt", { type: "text/plain" }))
        const response = await app.request("/api/public/livechat/upload", {
            method: "POST", headers: { "X-Session-Token": "invalid" }, body: form
        })
        expect(response.status).toBe(404)
    })

    test("view permission cannot claim, reply, resolve or upload", async () => {
        const { AppDataSource } = await import("../src/config/database")
        const { Role } = await import("../src/modules/rbac/entities/role.entity")
        const { Permission } = await import("../src/modules/rbac/entities/permission.entity")
        const roleRepository = AppDataSource.getRepository(Role)
        const role = await roleRepository.findOneByOrFail({ name: "Super Admin" })
        role.permissions = await AppDataSource.getRepository(Permission).findBy({ name: "livechat.view" })
        await roleRepository.save(role)
        const ticket = await startSession()
        for (const path of ["claim", "messages", "resolve"]) {
            const response = await request(app, `/api/livechat/tickets/${ticket.id}/${path}`, {
                method: "POST", headers: authHeaders, body: { message: "Not permitted" }
            })
            expect(response.status).toBe(403)
        }
        expect((await request(app, "/api/livechat/upload", { method: "POST", headers: authHeaders })).status).toBe(403)
        expect((await request(app, "/api/livechat/tickets", { headers: authHeaders })).status).toBe(200)
    })

    test("concurrent visitor messages keep exact unread counts", async () => {
        const ticket = await startSession()
        const headers = { "X-Session-Token": ticket.sessionToken }
        const responses = await Promise.all(Array.from({ length: 5 }, (_, index) => request(app, "/api/public/livechat/messages", {
            method: "POST", headers, body: { message: `Message ${index}` }
        })))
        expect(responses.every(response => response.status === 201)).toBe(true)
        const response = await request(app, "/api/public/livechat/session", { headers })
        expect(response.body.data.unreadCountUser).toBe(5)
    })

    test("long conversations return the latest 200 messages in chronological order", async () => {
        const ticket = await startSession()
        const { AppDataSource } = await import("../src/config/database")
        const { ChatMessage } = await import("../src/modules/livechat/entities/chat-message.entity")
        const { ChatSenderType } = await import("../src/modules/livechat/enum/chat-message.enum")
        const repository = AppDataSource.getRepository(ChatMessage)
        await repository.save(Array.from({ length: 205 }, (_, index) => repository.create({
            sessionId: ticket.id, senderType: ChatSenderType.VISITOR, senderName: "Visitor",
            message: `Message ${index}`, createdAt: new Date(1700000000000 + index * 1000)
        })))
        const response = await request(app, "/api/public/livechat/messages", {
            headers: { "X-Session-Token": ticket.sessionToken }
        })
        expect(response.body.data.messages).toHaveLength(200)
        expect(response.body.data.messages[0].message).toBe("Message 5")
        expect(response.body.data.messages[199].message).toBe("Message 204")
    })

    test("closed tickets reject staff replies and repeated close is idempotent", async () => {
        const ticket = await startSession()
        const headers = { "X-Session-Token": ticket.sessionToken }
        await request(app, "/api/public/livechat/close", { method: "POST", headers })
        await request(app, "/api/public/livechat/close", { method: "POST", headers })
        const response = await request(app, `/api/livechat/tickets/${ticket.id}/messages`, {
            method: "POST", headers: authHeaders, body: { message: "Too late" }
        })
        expect(response.status).toBe(400)
        const history = await request(app, "/api/public/livechat/messages", { headers })
        expect(history.body.data.messages).toHaveLength(1)
    })

    test("invalid ticket query and ID fail validation", async () => {
        for (const path of ["/api/livechat/tickets?page=0", "/api/livechat/tickets?limit=101", "/api/livechat/tickets/abc"]) {
            expect((await request(app, path, { headers: authHeaders })).status).toBe(422)
        }
    })
})
