import { Context } from "hono"
import { ApiResponse } from "../../../core/helpers/response"
import { resolveClientIp } from "../../../core/helpers/client-ip"
import { BadRequestException } from "../../../core/exceptions/base"
import { ArticleService } from "../services/article.service"
import { ArticleSerializer } from "../serializers/article.serialize"
import { ArticleViewSerializer } from "../serializers/article-view.serialize"
import { ArticleStatus } from "../enum/article-status.enum"
import type { CreateArticleValidator, RecordViewValidator } from "../validators/article.validator"

export class ArticleController {
    constructor(private readonly service: ArticleService) { }

    async index(c: Context) {
        const page = Number(c.req.query("page") || 1)
        const limit = Number(c.req.query("limit") || 10)
        const q = c.req.query("q") || ""
        const categoryId = c.req.query("categoryId") ? Number(c.req.query("categoryId")) : undefined
        const status = c.req.query("status") as ArticleStatus | undefined
        const sortBy = c.req.query("sortBy") || undefined
        const order = c.req.query("order")?.toUpperCase() === "ASC" ? "ASC" : "DESC"

        const { data, total } = await this.service.getAll(
            page,
            limit,
            q,
            { categoryId, status },
            sortBy,
            order
        )

        const serialized = await ArticleSerializer.collection(data)
        return ApiResponse.paginate(c, serialized, total, page, limit, "Articles retrieved successfully")
    }

    async show(c: Context) {
        const id = Number(c.req.param("id"))
        const article = await this.service.getById(id)
        const serialized = await ArticleSerializer.single(article)
        return ApiResponse.success(c, serialized, "Article retrieved successfully")
    }

    async publicIndex(c: Context) {
        const page = Number(c.req.query("page") || 1)
        const limit = Number(c.req.query("limit") || 9)
        const q = c.req.query("q") || ""
        const categoryId = c.req.query("categoryId") ? Number(c.req.query("categoryId")) : undefined
        const sortBy = c.req.query("sortBy") || undefined
        const order = c.req.query("order")?.toUpperCase() === "ASC" ? "ASC" : "DESC"

        const { data, total } = await this.service.getPublished(
            page,
            limit,
            q,
            { categoryId },
            sortBy,
            order
        )

        const serialized = await ArticleSerializer.publicCollection(data)
        return ApiResponse.paginate(c, serialized, total, page, limit, "Articles retrieved successfully")
    }

    async showBySlug(c: Context) {
        const slug = c.req.param("slug")
        if (!slug) {
            throw new BadRequestException("Slug is required")
        }
        const article = await this.service.getBySlug(slug)
        const serialized = await ArticleSerializer.single(article)
        return ApiResponse.success(c, serialized, "Article retrieved successfully")
    }

    async store(c: Context) {
        const data = c.req.valid("json" as never) as CreateArticleValidator
        const user = c.get("user") as { id: number } | undefined
        const article = await this.service.create(data, user?.id)
        const serialized = await ArticleSerializer.single(article)
        return ApiResponse.success(c, serialized, "Article created successfully", 201)
    }

    async update(c: Context) {
        const id = Number(c.req.param("id"))
        const data = c.req.valid("json" as never)
        const article = await this.service.update(id, data)
        const serialized = await ArticleSerializer.single(article)
        return ApiResponse.success(c, serialized, "Article updated successfully")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Article deleted successfully")
    }

    async recordView(c: Context) {
        const id = Number(c.req.param("id"))
        const body = c.req.valid("json" as never) as RecordViewValidator
        const ipAddress = resolveClientIp(c) ?? null
        const userAgent = c.req.header("user-agent") || null
        const referrer = body.referrer || c.req.header("referer") || null
        const authUser = c.get("user") as { id: number } | undefined

        const view = await this.service.recordView(id, {
            ipAddress,
            userAgent,
            referrer,
            userId: authUser?.id || null,
        })

        return ApiResponse.success(c, ArticleViewSerializer.single(view), "View recorded successfully")
    }

    async views(c: Context) {
        const id = Number(c.req.param("id"))
        const limit = Number(c.req.query("limit") || 50)
        const views = await this.service.getViews(id, limit)
        return ApiResponse.success(c, ArticleViewSerializer.collection(views), "Views retrieved successfully")
    }
}
