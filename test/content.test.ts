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
import { ArticleStatus } from "../src/modules/content/enum/article-status.enum"

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
// CATEGORIES
// ═══════════════════════════════════════════════════════════════════════════

describe("Content - Categories API", () => {
    test("should create a category successfully", async () => {
        const { status, body } = await request(app, "/api/content/categories", {
            method: "POST",
            headers: authHeaders,
            body: {
                name: "Technology",
                description: "All about tech & programming",
            },
        })

        expect(status).toBe(201)
        expect(body.success).toBe(true)
        expect(body.data.id).toBeDefined()
        expect(body.data.name).toBe("Technology")
        expect(body.data.slug).toBe("technology")
        expect(body.data.description).toBe("All about tech & programming")
    })

    test("should fail validation when category name is missing", async () => {
        const { status, body } = await request(app, "/api/content/categories", {
            method: "POST",
            headers: authHeaders,
            body: { description: "Missing name" },
        })

        expect(status).toBe(422)
        expect(body.success).toBe(false)
    })

    test("should fail when slug is already in use", async () => {
        await request(app, "/api/content/categories", {
            method: "POST",
            headers: authHeaders,
            body: { name: "Design", slug: "design" },
        })

        const { status, body } = await request(app, "/api/content/categories", {
            method: "POST",
            headers: authHeaders,
            body: { name: "Design 2", slug: "design" },
        })

        expect(status).toBe(400)
        expect(body.success).toBe(false)
        expect(body.message).toContain("already in use")
    })

    test("should retrieve paginated categories", async () => {
        await request(app, "/api/content/categories", {
            method: "POST",
            headers: authHeaders,
            body: { name: "Frontend" },
        })
        await request(app, "/api/content/categories", {
            method: "POST",
            headers: authHeaders,
            body: { name: "Backend" },
        })

        const { status, body } = await request(app, "/api/content/categories?page=1&limit=10", {
            method: "GET",
            headers: authHeaders,
        })

        expect(status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.data.length).toBe(2)
        expect(body.meta.total).toBe(2)
    })

    test("should retrieve all categories without pagination", async () => {
        await request(app, "/api/content/categories", {
            method: "POST",
            headers: authHeaders,
            body: { name: "Category A" },
        })
        await request(app, "/api/content/categories", {
            method: "POST",
            headers: authHeaders,
            body: { name: "Category B" },
        })

        const { status, body } = await request(app, "/api/content/categories/all", {
            method: "GET",
            headers: authHeaders,
        })

        expect(status).toBe(200)
        expect(body.success).toBe(true)
        expect(body.data.length).toBe(2)
    })

    test("should retrieve category by ID", async () => {
        const createRes = await request(app, "/api/content/categories", {
            method: "POST",
            headers: authHeaders,
            body: { name: "DevOps" },
        })
        const id = createRes.body.data.id

        const { status, body } = await request(app, `/api/content/categories/${id}`, {
            method: "GET",
            headers: authHeaders,
        })

        expect(status).toBe(200)
        expect(body.data.name).toBe("DevOps")
    })

    test("should update a category", async () => {
        const createRes = await request(app, "/api/content/categories", {
            method: "POST",
            headers: authHeaders,
            body: { name: "Old Name", description: "Old description" },
        })
        const id = createRes.body.data.id

        const { status, body } = await request(app, `/api/content/categories/${id}`, {
            method: "PUT",
            headers: authHeaders,
            body: { name: "New Name", description: "Updated description" },
        })

        expect(status).toBe(200)
        expect(body.data.name).toBe("New Name")
        expect(body.data.slug).toBe("new-name")
        expect(body.data.description).toBe("Updated description")
    })

    test("should delete a category", async () => {
        const createRes = await request(app, "/api/content/categories", {
            method: "POST",
            headers: authHeaders,
            body: { name: "To Delete" },
        })
        const id = createRes.body.data.id

        const delRes = await request(app, `/api/content/categories/${id}`, {
            method: "DELETE",
            headers: authHeaders,
        })
        expect(delRes.status).toBe(200)

        const getRes = await request(app, `/api/content/categories/${id}`, {
            method: "GET",
            headers: authHeaders,
        })
        expect(getRes.status).toBe(404)
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// ARTICLES
// ═══════════════════════════════════════════════════════════════════════════

describe("Content - Articles API", () => {
    test("should create an article with draft status, author, description, and tags", async () => {
        const catRes = await request(app, "/api/content/categories", {
            method: "POST",
            headers: authHeaders,
            body: { name: "Nuxt JS" },
        })
        const categoryId = catRes.body.data.id

        const { status, body } = await request(app, "/api/content/articles", {
            method: "POST",
            headers: authHeaders,
            body: {
                title: "Getting Started with Nuxt 4",
                categoryId,
                description: "Comprehensive guide to Nuxt 4 development.",
                cover: "articles/nuxt-cover.png",
                content: "<p>Welcome to Nuxt 4 tutorial.</p>",
                tags: ["nuxt", "vue", "frontend"],
                status: ArticleStatus.DRAFT,
            },
        })

        expect(status).toBe(201)
        expect(body.success).toBe(true)
        expect(body.data.id).toBeDefined()
        expect(body.data.title).toBe("Getting Started with Nuxt 4")
        expect(body.data.slug).toBe("getting-started-with-nuxt-4")
        expect(body.data.categoryId).toBe(categoryId)
        expect(body.data.description).toBe("Comprehensive guide to Nuxt 4 development.")
        expect(body.data.authorId).toBeDefined()
        expect(body.data.author).toBeDefined()
        expect(body.data.status).toBe(ArticleStatus.DRAFT)
        expect(body.data.tags).toEqual(["nuxt", "vue", "frontend"])
        expect(body.data.viewsCount).toBe(0)
    })

    test("should set publishedAt when article is created with publish status", async () => {
        const { status, body } = await request(app, "/api/content/articles", {
            method: "POST",
            headers: authHeaders,
            body: {
                title: "Published Article",
                content: "<p>Content</p>",
                status: ArticleStatus.PUBLISH,
            },
        })

        expect(status).toBe(201)
        expect(body.data.status).toBe(ArticleStatus.PUBLISH)
        expect(body.data.publishedAt).not.toBeNull()
    })

    test("should fail validation when title is missing", async () => {
        const { status, body } = await request(app, "/api/content/articles", {
            method: "POST",
            headers: authHeaders,
            body: {
                content: "<p>Missing title</p>",
            },
        })

        expect(status).toBe(422)
        expect(body.success).toBe(false)
    })

    test("should retrieve paginated articles and filter by status and category", async () => {
        const catRes = await request(app, "/api/content/categories", {
            method: "POST",
            headers: authHeaders,
            body: { name: "Tech" },
        })
        const categoryId = catRes.body.data.id

        await request(app, "/api/content/articles", {
            method: "POST",
            headers: authHeaders,
            body: { title: "Draft 1", content: "body", categoryId, status: ArticleStatus.DRAFT },
        })
        await request(app, "/api/content/articles", {
            method: "POST",
            headers: authHeaders,
            body: { title: "Published 1", content: "body", categoryId, status: ArticleStatus.PUBLISH },
        })

        // All articles
        const listAll = await request(app, "/api/content/articles", {
            method: "GET",
            headers: authHeaders,
        })
        expect(listAll.status).toBe(200)
        expect(listAll.body.data.length).toBe(2)

        // Filter by publish
        const listPublish = await request(app, `/api/content/articles?status=${ArticleStatus.PUBLISH}`, {
            method: "GET",
            headers: authHeaders,
        })
        expect(listPublish.status).toBe(200)
        expect(listPublish.body.data.length).toBe(1)
        expect(listPublish.body.data[0].title).toBe("Published 1")
    })

    test("should retrieve article by slug publicly", async () => {
        const createRes = await request(app, "/api/content/articles", {
            method: "POST",
            headers: authHeaders,
            body: { title: "Public Article", content: "<p>Public content</p>" },
        })
        const slug = createRes.body.data.slug

        // Without auth headers
        const { status, body } = await request(app, `/api/content/articles/slug/${slug}`, {
            method: "GET",
        })

        expect(status).toBe(200)
        expect(body.data.title).toBe("Public Article")
        expect(body.data.slug).toBe(slug)
    })

    test("should update article and publish draft", async () => {
        const createRes = await request(app, "/api/content/articles", {
            method: "POST",
            headers: authHeaders,
            body: { title: "Draft to Publish", content: "content", status: ArticleStatus.DRAFT },
        })
        const id = createRes.body.data.id
        expect(createRes.body.data.publishedAt).toBeNull()

        const { status, body } = await request(app, `/api/content/articles/${id}`, {
            method: "PUT",
            headers: authHeaders,
            body: {
                title: "Updated Title",
                description: "Updated description for article",
                status: ArticleStatus.PUBLISH,
            },
        })

        expect(status).toBe(200)
        expect(body.data.title).toBe("Updated Title")
        expect(body.data.description).toBe("Updated description for article")
        expect(body.data.status).toBe(ArticleStatus.PUBLISH)
        expect(body.data.publishedAt).not.toBeNull()
    })

    test("should delete article", async () => {
        const createRes = await request(app, "/api/content/articles", {
            method: "POST",
            headers: authHeaders,
            body: { title: "To Delete", content: "content" },
        })
        const id = createRes.body.data.id

        const delRes = await request(app, `/api/content/articles/${id}`, {
            method: "DELETE",
            headers: authHeaders,
        })
        expect(delRes.status).toBe(200)

        const getRes = await request(app, `/api/content/articles/${id}`, {
            method: "GET",
            headers: authHeaders,
        })
        expect(getRes.status).toBe(404)
    })
})

// ═══════════════════════════════════════════════════════════════════════════
// ARTICLE VIEWS
// ═══════════════════════════════════════════════════════════════════════════

describe("Content - Article Views API", () => {
    test("should record viewer data and increment article views count", async () => {
        const createRes = await request(app, "/api/content/articles", {
            method: "POST",
            headers: authHeaders,
            body: { title: "Trackable Article", content: "body" },
        })
        const id = createRes.body.data.id

        // Record 1st view
        const viewRes1 = await request(app, `/api/content/articles/${id}/view`, {
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 TestBrowser",
                "X-Forwarded-For": "203.0.113.195",
            },
            body: { referrer: "https://google.com" },
        })
        expect(viewRes1.status).toBe(200)
        expect(viewRes1.body.data.ipAddress).toBe("203.0.113.195")
        expect(viewRes1.body.data.referrer).toBe("https://google.com")

        // Record 2nd view
        const viewRes2 = await request(app, `/api/content/articles/${id}/view`, {
            method: "POST",
            headers: {
                "User-Agent": "Mozilla/5.0 AnotherBrowser",
                "X-Forwarded-For": "198.51.100.10",
            },
        })
        expect(viewRes2.status).toBe(200)

        // Check article views count
        const articleRes = await request(app, `/api/content/articles/${id}`, {
            method: "GET",
            headers: authHeaders,
        })
        expect(articleRes.body.data.viewsCount).toBe(2)

        // Check views history
        const viewsListRes = await request(app, `/api/content/articles/${id}/views`, {
            method: "GET",
            headers: authHeaders,
        })
        expect(viewsListRes.status).toBe(200)
        expect(viewsListRes.body.data.length).toBe(2)
    })
})
