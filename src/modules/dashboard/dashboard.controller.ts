import { Context } from "hono"
import { DashboardService } from "./dashboard.service"
import { ApiResponse } from "../../core/helpers/response"

export class DashboardController {
    constructor(private readonly service: DashboardService) {}

    async getStats(c: Context) {
        const stats = await this.service.getStats()
        return ApiResponse.success(c, stats, "Dashboard statistics retrieved successfully")
    }
}
