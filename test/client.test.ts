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
// Public Access
// ═══════════════════════════════════════════════════════════════════════════

describe("Client - Public API", () => {
    test("GET /api/clients should return 200 without auth", async () => {
        const { status, body } = await request(app, "/api/clients")
        expect(status).toBe(200)
        expect(body.success).toBe(true)
        expect(Array.isArray(body.data)).toBe(true)
    })

    test("GET /api/clients/public should return 200 without auth", async () => {
        const { status, body } = await request(app, "/api/clients/public")
        expect(status).toBe(200)
        expect(body.success).toBe(true)
        expect(Array.isArray(body.data)).toBe(true)
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// Authentication Required
// ═══════════════════════════════════════════════════════════════════════════

describe("Client - Auth Required", () => {
    test("GET /api/client should fail without auth", async () => {
        const { status, body } = await request(app, "/api/client")
        expect(status).toBe(401)
        expect(body.success).toBe(false)
    })

    test("POST /api/client should fail without auth", async () => {
        const { status, body } = await request(app, "/api/client", {
            method: "POST",
            body: { name: "Client A", logo: "/path/logo.png" },
        })
        expect(status).toBe(401)
        expect(body.success).toBe(false)
    })

    test("PUT /api/client/:id should fail without auth", async () => {
        const { status, body } = await request(app, "/api/client/1", {
            method: "PUT",
            body: { name: "Updated" },
        })
        expect(status).toBe(401)
        expect(body.success).toBe(false)
    })

    test("DELETE /api/client/:id should fail without auth", async () => {
        const { status, body } = await request(app, "/api/client/1", {
            method: "DELETE",
        })
        expect(status).toBe(401)
        expect(body.success).toBe(false)
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// CRUD Operations
// ═══════════════════════════════════════════════════════════════════════════

describe("Client - CRUD API", () => {
    test("should create a client successfully", async () => {
        const { status, body } = await request(app, "/api/client", {
            method: "POST",
            headers: authHeaders,
            body: {
                name: "Astra International",
                logo: "clients/astra.png",
                website: "https://astra.co.id",
                order: 1,
                isActive: true,
            },
        })

        expect(status).toBe(201)
        expect(body.success).toBe(true)
        expect(body.data.name).toBe("Astra International")
        expect(body.data.website).toBe("https://astra.co.id")
        expect(body.data.order).toBe(1)
        expect(body.data.isActive).toBe(true)
        expect(body.data.logoUrl).toContain("astra.png")
    })

    test("should fail to create without name", async () => {
        const { status, body } = await request(app, "/api/client", {
            method: "POST",
            headers: authHeaders,
            body: {
                logo: "clients/test.png",
            },
        })

        expect(status).toBe(422)
        expect(body.success).toBe(false)
    })

    test("should retrieve created client via public API", async () => {
        // Create active client
        await request(app, "/api/client", {
            method: "POST",
            headers: authHeaders,
            body: {
                name: "Active Client",
                logo: "clients/active.png",
                isActive: true,
            },
        })

        // Create inactive client
        await request(app, "/api/client", {
            method: "POST",
            headers: authHeaders,
            body: {
                name: "Inactive Client",
                logo: "clients/inactive.png",
                isActive: false,
            },
        })

        const { status, body } = await request(app, "/api/clients")
        expect(status).toBe(200)
        expect(body.data.length).toBe(1)
        expect(body.data[0].name).toBe("Active Client")
    })

    test("should list clients with search query", async () => {
        await request(app, "/api/client", {
            method: "POST",
            headers: authHeaders,
            body: { name: "President University", logo: "clients/pres.png" },
        })
        await request(app, "/api/client", {
            method: "POST",
            headers: authHeaders,
            body: { name: "ITM", logo: "clients/itm.png" },
        })

        const { status, body } = await request(app, "/api/client?q=President", {
            headers: authHeaders,
        })

        expect(status).toBe(200)
        expect(body.data.length).toBe(1)
        expect(body.data[0].name).toBe("President University")
    })

    test("should update a client", async () => {
        const createRes = await request(app, "/api/client", {
            method: "POST",
            headers: authHeaders,
            body: {
                name: "Old Client",
                logo: "clients/old.png",
                order: 1,
            },
        })

        const clientId = createRes.body.data.id

        const { status, body } = await request(app, `/api/client/${clientId}`, {
            method: "PUT",
            headers: authHeaders,
            body: {
                name: "Updated Client",
                website: "https://newwebsite.com",
            },
        })

        expect(status).toBe(200)
        expect(body.data.name).toBe("Updated Client")
        expect(body.data.website).toBe("https://newwebsite.com")
    })

    test("should delete a client", async () => {
        const createRes = await request(app, "/api/client", {
            method: "POST",
            headers: authHeaders,
            body: {
                name: "To Delete",
                logo: "clients/delete.png",
            },
        })

        const clientId = createRes.body.data.id

        const { status, body } = await request(app, `/api/client/${clientId}`, {
            method: "DELETE",
            headers: authHeaders,
        })

        expect(status).toBe(200)
        expect(body.success).toBe(true)

        // Verify it no longer exists
        const getRes = await request(app, `/api/client/${clientId}`, {
            headers: authHeaders,
        })
        expect(getRes.status).toBe(404)
    })
})
