export interface DashboardSummaryData {
    totalArticles: number
    publishedArticles: number
    draftArticles: number
    totalViews: number
    totalUsers: number
    totalCategories: number
    totalMessages: number
    unreadMessages: number
    totalFaqs: number
}

export interface ViewsTrendData {
    date: string
    label: string
    views: number
    articles: number
}

export interface CategoryDistributionData {
    name: string
    count: number
}

export interface MessagesTrendData {
    month: string
    unread: number
    read: number
}

export interface IDashboardRepository {
    getSummary(): Promise<DashboardSummaryData>
    getViewsTrend(daysCount?: number): Promise<ViewsTrendData[]>
    getCategoriesDistribution(): Promise<CategoryDistributionData[]>
    getMessagesTrend(monthsCount?: number): Promise<MessagesTrendData[]>
    getRecentArticles(limit?: number): Promise<any[]>
    getRecentMessages(limit?: number): Promise<any[]>
}
