import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test"
import { Hono } from "hono"
import { initTestDatabase, destroyTestDatabase, cleanTestDatabase, createTestApp, registerAndLogin, request } from "./setup"
import { AppDataSource } from "../src/config/database"
import { Category } from "../src/modules/content/entities/category.entity"
import { Article } from "../src/modules/content/entities/article.entity"
import { ArticleView } from "../src/modules/content/entities/article-view.entity"
import { Message } from "../src/modules/message/entities/message.entity"
import { ArticleStatus } from "../src/modules/content/enum/article-status.enum"

describe("Dashboard - Modular Statistics Endpoints", () => {
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

    it("should fail without auth token across dashboard endpoints", async () => {
        const endpoints = [
            "/api/dashboard/summary",
            "/api/dashboard/views-trend",
            "/api/dashboard/categories-distribution",
            "/api/dashboard/messages-trend",
            "/api/dashboard/recent-articles",
            "/api/dashboard/recent-messages",
        ]

        for (const ep of endpoints) {
            const res = await request(app, ep)
            expect(res.status).toBe(401)
            expect(res.body.success).toBe(false)
        }
    })

    it("GET /api/dashboard/summary should return metrics", async () => {
        const catRepo = AppDataSource.getRepository(Category)
        const artRepo = AppDataSource.getRepository(Article)
        const msgRepo = AppDataSource.getRepository(Message)

        const category = await catRepo.save(catRepo.create({ name: "Tekno", slug: "tekno" }))
        await artRepo.save(artRepo.create({
            title: "Art 1",
            slug: "art-1",
            content: "Body 1",
            status: ArticleStatus.PUBLISH,
            categoryId: category.id,
            viewsCount: 10,
        }))
        await artRepo.save(artRepo.create({
            title: "Art 2",
            slug: "art-2",
            content: "Body 2",
            status: ArticleStatus.DRAFT,
            categoryId: category.id,
            viewsCount: 0,
        }))
        await msgRepo.save(msgRepo.create({
            name: "Sender",
            email: "s@example.com",
            subject: "Hi",
            message: "Msg",
            isRead: false,
        }))

        const res = await request(app, "/api/dashboard/summary", { headers: auth.headers })
        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.totalArticles).toBe(2)
        expect(res.body.data.publishedArticles).toBe(1)
        expect(res.body.data.draftArticles).toBe(1)
        expect(res.body.data.totalViews).toBe(10)
        expect(res.body.data.totalMessages).toBe(1)
        expect(res.body.data.unreadMessages).toBe(1)
    })

    it("GET /api/dashboard/views-trend should return daily trend items", async () => {
        const res = await request(app, "/api/dashboard/views-trend?days=7", { headers: auth.headers })
        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data).toBeArray()
        expect(res.body.data.length).toBe(7)
        expect(res.body.data[0]).toHaveProperty("date")
        expect(res.body.data[0]).toHaveProperty("label")
        expect(res.body.data[0]).toHaveProperty("views")
        expect(res.body.data[0]).toHaveProperty("articles")
    })

    it("GET /api/dashboard/categories-distribution should return articles per category", async () => {
        const catRepo = AppDataSource.getRepository(Category)
        const artRepo = AppDataSource.getRepository(Article)

        const cat = await catRepo.save(catRepo.create({ name: "Bisnis", slug: "bisnis" }))
        await artRepo.save(artRepo.create({
            title: "Biz 1",
            slug: "biz-1",
            content: "Content",
            status: ArticleStatus.PUBLISH,
            categoryId: cat.id,
        }))

        const res = await request(app, "/api/dashboard/categories-distribution", { headers: auth.headers })
        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data).toBeArray()
        expect(res.body.data.length).toBe(1)
        expect(res.body.data[0].name).toBe("Bisnis")
        expect(res.body.data[0].count).toBe(1)
    })

    it("GET /api/dashboard/messages-trend should return monthly trend", async () => {
        const res = await request(app, "/api/dashboard/messages-trend?months=6", { headers: auth.headers })
        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data).toBeArray()
        expect(res.body.data.length).toBe(6)
        expect(res.body.data[0]).toHaveProperty("month")
        expect(res.body.data[0]).toHaveProperty("unread")
        expect(res.body.data[0]).toHaveProperty("read")
    })

    it("GET /api/dashboard/recent-articles should return serialized articles", async () => {
        const catRepo = AppDataSource.getRepository(Category)
        const artRepo = AppDataSource.getRepository(Article)

        const cat = await catRepo.save(catRepo.create({ name: "Opini", slug: "opini" }))
        await artRepo.save(artRepo.create({
            title: "Recent 1",
            slug: "recent-1",
            content: "Content",
            status: ArticleStatus.PUBLISH,
            categoryId: cat.id,
        }))

        const res = await request(app, "/api/dashboard/recent-articles?limit=5", { headers: auth.headers })
        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.length).toBe(1)
        expect(res.body.data[0].title).toBe("Recent 1")
        expect(res.body.data[0].category.name).toBe("Opini")
        expect(res.body.data[0]).toHaveProperty("coverUrl")
    })

    it("GET /api/dashboard/recent-messages should return serialized messages", async () => {
        const msgRepo = AppDataSource.getRepository(Message)
        await msgRepo.save(msgRepo.create({
            name: "User Test",
            email: "test@example.com",
            subject: "Inquiry",
            message: "Hello",
            isRead: false,
        }))

        const res = await request(app, "/api/dashboard/recent-messages?limit=5", { headers: auth.headers })
        expect(res.status).toBe(200)
        expect(res.body.success).toBe(true)
        expect(res.body.data.length).toBe(1)
        expect(res.body.data[0].name).toBe("User Test")
        expect(res.body.data[0].isRead).toBe(false)
    })
})
