import { Context } from "hono"
import { ApiResponse } from "../../core/helpers/response"
import { StorageService } from "./storage.service"

export class StorageController {
    constructor(private readonly service: StorageService) {}

    async upload(c: Context) {
        const body = await c.req.parseBody()
        const result = await this.service.upload(body["file"])

        return ApiResponse.success(c, result, "File uploaded successfully")
    }

    async proxy(c: Context) {
        return await this.service.proxy(c.req.query("path"))
    }
}
