import { IDashboardRepository } from "./interfaces/dashboard.repository.interface"

export class DashboardService {
    constructor(private readonly repository: IDashboardRepository) {}

    async getSummary() {
        return await this.repository.getSummary()
    }

    async getViewsTrend(daysCount: number = 7) {
        return await this.repository.getViewsTrend(daysCount)
    }

    async getCategoriesDistribution() {
        return await this.repository.getCategoriesDistribution()
    }

    async getMessagesTrend(monthsCount: number = 6) {
        return await this.repository.getMessagesTrend(monthsCount)
    }

    async getRecentArticles(limit: number = 5) {
        return await this.repository.getRecentArticles(limit)
    }

    async getRecentMessages(limit: number = 5) {
        return await this.repository.getRecentMessages(limit)
    }
}
