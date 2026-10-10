import { Context } from "hono"
import { MessageService } from "./message.service"
import { MessageSerializer } from "./serializers/message.serialize"
import { ApiResponse } from "../../core/helpers/response"

export class MessageController {
    constructor(private readonly service: MessageService) {}

    async index(c: Context) {
        const page = Number(c.req.query("page") || 1)
        const limit = Number(c.req.query("limit") || 10)
        const q = c.req.query("q") || ""
        const isReadQuery = c.req.query("isRead")
        const isRead = isReadQuery !== undefined ? isReadQuery === "true" || isReadQuery === "1" : undefined
        const sortBy = c.req.query("sortBy") || undefined
        const order = c.req.query("order")?.toUpperCase() === "ASC" ? "ASC" : "DESC"

        const { data, total } = await this.service.getAll(
            page,
            limit,
            q,
            { isRead },
            sortBy,
            order
        )

        return ApiResponse.paginate(c, MessageSerializer.collection(data), total, page, limit, "Messages retrieved successfully")
    }

    async show(c: Context) {
        const id = Number(c.req.param("id"))
        const message = await this.service.getById(id)
        return ApiResponse.success(c, MessageSerializer.single(message), "Message retrieved successfully")
    }

    async store(c: Context) {
        const data = c.req.valid("json" as never)
        const message = await this.service.create(data)
        return ApiResponse.success(c, MessageSerializer.single(message), "Message sent successfully", 201)
    }

    async updateStatus(c: Context) {
        const id = Number(c.req.param("id"))
        const { isRead } = c.req.valid("json" as never) as { isRead: boolean }
        const message = await this.service.updateStatus(id, isRead)
        return ApiResponse.success(c, MessageSerializer.single(message), "Message status updated successfully")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Message deleted successfully")
    }
}
