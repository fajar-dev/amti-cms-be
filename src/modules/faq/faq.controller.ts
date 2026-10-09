import { Context } from "hono"
import { FaqService } from "./faq.service"
import { FaqSerializer } from "./serializers/faq.serialize"
import { ApiResponse } from "../../core/helpers/response"

export class FaqController {
    constructor(private readonly service: FaqService) {}

    async index(c: Context) {
        const page = Number(c.req.query("page") || 1)
        const limit = Number(c.req.query("limit") || 10)
        const q = c.req.query("q") || ""
        const isActiveQuery = c.req.query("isActive")
        const isActive = isActiveQuery !== undefined ? isActiveQuery === "true" || isActiveQuery === "1" : undefined
        const sortBy = c.req.query("sortBy") || undefined
        const order = c.req.query("order")?.toUpperCase() === "DESC" ? "DESC" : "ASC"

        const { data, total } = await this.service.getAll(
            page,
            limit,
            q,
            { isActive },
            sortBy,
            order
        )

        return ApiResponse.paginate(c, FaqSerializer.collection(data), total, page, limit, "FAQs retrieved successfully")
    }

    async show(c: Context) {
        const id = Number(c.req.param("id"))
        const faq = await this.service.getById(id)
        return ApiResponse.success(c, FaqSerializer.single(faq), "FAQ retrieved successfully")
    }

    async store(c: Context) {
        const data = c.req.valid("json" as never)
        const faq = await this.service.create(data)
        return ApiResponse.success(c, FaqSerializer.single(faq), "FAQ created successfully", 201)
    }

    async update(c: Context) {
        const id = Number(c.req.param("id"))
        const data = c.req.valid("json" as never)
        const faq = await this.service.update(id, data)
        return ApiResponse.success(c, FaqSerializer.single(faq), "FAQ updated successfully")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "FAQ deleted successfully")
    }
}
