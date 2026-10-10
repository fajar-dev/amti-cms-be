import { Context } from "hono"
import { DashboardService } from "./dashboard.service"
import { DashboardSerializer } from "./serializers/dashboard.serializer"
import { ApiResponse } from "../../core/helpers/response"

export class DashboardController {
    constructor(private readonly service: DashboardService) {}

    async getSummary(c: Context) {
        const summary = await this.service.getSummary()
        return ApiResponse.success(c, summary, "Dashboard summary retrieved successfully")
    }

    async getViewsTrend(c: Context) {
        const days = Number(c.req.query("days") || 7)
        const trend = await this.service.getViewsTrend(days)
        return ApiResponse.success(c, trend, "Views trend retrieved successfully")
    }

    async getCategoriesDistribution(c: Context) {
        const distribution = await this.service.getCategoriesDistribution()
        return ApiResponse.success(c, distribution, "Categories distribution retrieved successfully")
    }

    async getMessagesTrend(c: Context) {
        const months = Number(c.req.query("months") || 6)
        const trend = await this.service.getMessagesTrend(months)
        return ApiResponse.success(c, trend, "Messages trend retrieved successfully")
    }

    async getRecentArticles(c: Context) {
        const limit = Number(c.req.query("limit") || 5)
        const articles = await this.service.getRecentArticles(limit)
        return ApiResponse.success(c, DashboardSerializer.recentArticles(articles), "Recent articles retrieved successfully")
    }

    async getRecentMessages(c: Context) {
        const limit = Number(c.req.query("limit") || 5)
        const messages = await this.service.getRecentMessages(limit)
        return ApiResponse.success(c, DashboardSerializer.recentMessages(messages), "Recent messages retrieved successfully")
    }
}
