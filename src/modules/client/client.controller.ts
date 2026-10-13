import { Context } from "hono"
import { ClientService } from "./client.service"
import { ClientSerializer } from "./serializers/client.serialize"
import { ApiResponse } from "../../core/helpers/response"

export class ClientController {
    constructor(private readonly service: ClientService) {}

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

        const serialized = await ClientSerializer.collection(data)
        return ApiResponse.paginate(c, serialized, total, page, limit, "Clients retrieved successfully")
    }

    async publicIndex(c: Context) {
        const page = Number(c.req.query("page") || 1)
        const limit = Number(c.req.query("limit") || 100)
        const q = c.req.query("q") || ""

        const { data, total } = await this.service.getAll(
            page,
            limit,
            q,
            { isActive: true },
            "order",
            "ASC"
        )

        const serialized = await ClientSerializer.collection(data)
        return ApiResponse.paginate(c, serialized, total, page, limit, "Public clients retrieved successfully")
    }

    async show(c: Context) {
        const id = Number(c.req.param("id"))
        const client = await this.service.getById(id)
        const serialized = await ClientSerializer.single(client)
        return ApiResponse.success(c, serialized, "Client retrieved successfully")
    }

    async store(c: Context) {
        const data = c.req.valid("json" as never)
        const client = await this.service.create(data)
        const serialized = await ClientSerializer.single(client)
        return ApiResponse.success(c, serialized, "Client created successfully", 201)
    }

    async update(c: Context) {
        const id = Number(c.req.param("id"))
        const data = c.req.valid("json" as never)
        const client = await this.service.update(id, data)
        const serialized = await ClientSerializer.single(client)
        return ApiResponse.success(c, serialized, "Client updated successfully")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Client deleted successfully")
    }
}
