import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test"
import { Hono } from "hono"
import { initTestDatabase, destroyTestDatabase, cleanTestDatabase, createTestApp, registerAndLogin, request } from "./setup"
import { AppDataSource } from "../src/config/database"
import { Category } from "../src/modules/content/entities/category.entity"
import { Article } from "../src/modules/content/entities/article.entity"
import { ArticleView } from "../src/modules/content/entities/article-view.entity"
import { Message } from "../src/modules/message/entities/message.entity"
import { ArticleStatus } from "../src/modules/content/enum/article-status.enum"

describe("Dashboard - Statistics & Metrics", () => {
    let app: Hono
    let auth: { accessToken: string; headers: { Authorization: string } }

    beforeAll(async () => {
        await initTestDatabase()
        app = createTestApp()
    })

    afterAll(async () => {
        await destroyTestDatabase()
    })

    beforeEach(async () => {
        await cleanTestDatabase()
        auth = await registerAndLogin(app, {
            name: "Admin User",
            email: "admin@example.com",
            password: "password123",
        })
    })

    it("GET /api/dashboard/stats should fail without auth token", async () => {
        const res = await request(app, "/api/dashboard/stats")
        expect(res.status).toBe(401)
        expect(res.body.success).toBe(false)
    })

    it("GET /api/dashboard/stats should return structure even when empty", async () => {
        const res = await request(app, "/api/dashboard/stats", {
            headers: auth.headers,
        })

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data).toBeDefined()
        expect(res.body.data.summary).toBeDefined()
        expect(res.body.data.summary.totalArticles).toBe(0)
        expect(res.body.data.summary.totalUsers).toBe(1)
        expect(res.body.data.viewsTrend).toBeArray()
        expect(res.body.data.viewsTrend.length).toBe(7)
        expect(res.body.data.articlesByCategory).toBeArray()
        expect(res.body.data.messagesTrend).toBeArray()
        expect(res.body.data.messagesTrend.length).toBe(6)
        expect(res.body.data.recentArticles).toBeArray()
        expect(res.body.data.recentMessages).toBeArray()
    })

    it("GET /api/dashboard/stats should return dynamic counts when data exists", async () => {
        const catRepo = AppDataSource.getRepository(Category)
        const artRepo = AppDataSource.getRepository(Article)
        const viewRepo = AppDataSource.getRepository(ArticleView)
        const msgRepo = AppDataSource.getRepository(Message)

        // Create Category
        const category = await catRepo.save(
            catRepo.create({
                name: "Teknologi",
                slug: "teknologi",
            })
        )

        // Create Articles
        const article1 = await artRepo.save(
            artRepo.create({
                title: "Artikel Pertama",
                slug: "artikel-pertama",
                content: "Konten pertama",
                status: ArticleStatus.PUBLISH,
                categoryId: category.id,
                viewsCount: 15,
            })
        )

        const article2 = await artRepo.save(
            artRepo.create({
                title: "Artikel Draft",
                slug: "artikel-draft",
                content: "Konten draft",
                status: ArticleStatus.DRAFT,
                categoryId: category.id,
                viewsCount: 0,
            })
        )

        // Create Views
        await viewRepo.save(
            viewRepo.create({
                articleId: article1.id,
                viewedAt: new Date(),
            })
        )

        // Create Messages
        await msgRepo.save(
            msgRepo.create({
                name: "Sender 1",
                email: "sender1@example.com",
                subject: "Pertanyaan",
                message: "Halo saya mau bertanya",
                isRead: false,
            })
        )

        await msgRepo.save(
            msgRepo.create({
                name: "Sender 2",
                email: "sender2@example.com",
                subject: "Info",
                message: "Pesan info",
                isRead: true,
            })
        )

        const res = await request(app, "/api/dashboard/stats", {
            headers: auth.headers,
        })

        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.summary.totalArticles).toBe(2)
        expect(res.body.data.summary.publishedArticles).toBe(1)
        expect(res.body.data.summary.draftArticles).toBe(1)
        expect(res.body.data.summary.totalCategories).toBe(1)
        expect(res.body.data.summary.totalViews).toBe(15)
        expect(res.body.data.summary.totalMessages).toBe(2)
        expect(res.body.data.summary.unreadMessages).toBe(1)

        // Category breakdown
        expect(res.body.data.articlesByCategory.length).toBe(1)
        expect(res.body.data.articlesByCategory[0].name).toBe("Teknologi")
        expect(res.body.data.articlesByCategory[0].count).toBe(2)

        // Recent items
        expect(res.body.data.recentArticles.length).toBe(2)
        expect(res.body.data.recentMessages.length).toBe(2)
    })
})
