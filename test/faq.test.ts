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
// Authentication Required
// ═══════════════════════════════════════════════════════════════════════════

describe("FAQ - Auth Required", () => {
    test("GET /api/faq should fail without auth", async () => {
        const { status, body } = await request(app, "/api/faq")
        expect(status).toBe(401)
        expect(body.success).toBe(false)
    })

    test("POST /api/faq should fail without auth", async () => {
        const { status, body } = await request(app, "/api/faq", {
            method: "POST",
            body: { question: "Q?", answer: "A!" },
        })
        expect(status).toBe(401)
        expect(body.success).toBe(false)
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// CRUD Operations
// ═══════════════════════════════════════════════════════════════════════════

describe("FAQ - CRUD API", () => {
    test("should create a FAQ successfully", async () => {
        const { status, body } = await request(app, "/api/faq", {
            method: "POST",
            headers: authHeaders,
            body: {
                question: "How do I reset my password?",
                answer: "Click forgot password on login screen.",
                order: 1,
                isActive: true,
            },
        })

        expect(status).toBe(201)
        expect(body.success).toBe(true)
        expect(body.data.id).toBeDefined()
        expect(body.data.question).toBe("How do I reset my password?")
        expect(body.data.answer).toBe("Click forgot password on login screen.")
        expect(body.data.order).toBe(1)
        expect(body.data.isActive).toBe(true)
    })

    test("should fail validation when question is missing", async () => {
        const { status, body } = await request(app, "/api/faq", {
            method: "POST",
            headers: authHeaders,
            body: {
                answer: "Answer without question",
            },
        })

        expect(status).toBe(422)
        expect(body.success).toBe(false)
    })

    test("should fail validation when answer is missing", async () => {
        const { status, body } = await request(app, "/api/faq", {
            method: "POST",
            headers: authHeaders,
            body: {
                question: "Question without answer?",
            },
        })

        expect(status).toBe(422)
        expect(body.success).toBe(false)
    })

    test("should retrieve paginated FAQs and filter by isActive", async () => {
        await request(app, "/api/faq", {
            method: "POST",
            headers: authHeaders,
            body: { question: "Active FAQ 1", answer: "Answer 1", isActive: true },
        })
        await request(app, "/api/faq", {
            method: "POST",
            headers: authHeaders,
            body: { question: "Inactive FAQ 2", answer: "Answer 2", isActive: false },
        })

        // All FAQs
        const allRes = await request(app, "/api/faq?page=1&limit=10", {
            method: "GET",
            headers: authHeaders,
        })
        expect(allRes.status).toBe(200)
        expect(allRes.body.data.length).toBe(2)
        expect(allRes.body.meta.total).toBe(2)

        // Filter by isActive
        const activeRes = await request(app, "/api/faq?isActive=true", {
            method: "GET",
            headers: authHeaders,
        })
        expect(activeRes.status).toBe(200)
        expect(activeRes.body.data.length).toBe(1)
        expect(activeRes.body.data[0].isActive).toBe(true)
    })

    test("should retrieve FAQ by ID", async () => {
        const createRes = await request(app, "/api/faq", {
            method: "POST",
            headers: authHeaders,
            body: { question: "Sample Q", answer: "Sample A" },
        })
        const id = createRes.body.data.id

        const { status, body } = await request(app, `/api/faq/${id}`, {
            method: "GET",
            headers: authHeaders,
        })

        expect(status).toBe(200)
        expect(body.data.id).toBe(id)
        expect(body.data.question).toBe("Sample Q")
    })

    test("should return 404 when FAQ not found", async () => {
        const { status, body } = await request(app, "/api/faq/99999", {
            method: "GET",
            headers: authHeaders,
        })

        expect(status).toBe(404)
        expect(body.success).toBe(false)
    })

    test("should update a FAQ", async () => {
        const createRes = await request(app, "/api/faq", {
            method: "POST",
            headers: authHeaders,
            body: { question: "Old Question", answer: "Old Answer", order: 5 },
        })
        const id = createRes.body.data.id

        const { status, body } = await request(app, `/api/faq/${id}`, {
            method: "PUT",
            headers: authHeaders,
            body: {
                question: "Updated Question",
                answer: "Updated Answer",
                order: 10,
                isActive: false,
            },
        })

        expect(status).toBe(200)
        expect(body.data.question).toBe("Updated Question")
        expect(body.data.answer).toBe("Updated Answer")
        expect(body.data.order).toBe(10)
        expect(body.data.isActive).toBe(false)
    })

    test("should delete a FAQ", async () => {
        const createRes = await request(app, "/api/faq", {
            method: "POST",
            headers: authHeaders,
            body: { question: "To Delete", answer: "Answer" },
        })
        const id = createRes.body.data.id

        const delRes = await request(app, `/api/faq/${id}`, {
            method: "DELETE",
            headers: authHeaders,
        })
        expect(delRes.status).toBe(200)
        expect(delRes.body.success).toBe(true)

        const getRes = await request(app, `/api/faq/${id}`, {
            method: "GET",
            headers: authHeaders,
        })
        expect(getRes.status).toBe(404)
    })
})
