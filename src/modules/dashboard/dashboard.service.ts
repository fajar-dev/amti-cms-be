import { AppDataSource } from "../../config/database"
import { Article } from "../content/entities/article.entity"
import { Category } from "../content/entities/category.entity"
import { ArticleView } from "../content/entities/article-view.entity"
import { User } from "../user/entities/user.entity"
import { Message } from "../message/entities/message.entity"
import { Faq } from "../faq/entities/faq.entity"
import { ArticleStatus } from "../content/enum/article-status.enum"

export class DashboardService {
    private get articleRepo() {
        return AppDataSource.getRepository(Article)
    }

    private get categoryRepo() {
        return AppDataSource.getRepository(Category)
    }

    private get articleViewRepo() {
        return AppDataSource.getRepository(ArticleView)
    }

    private get userRepo() {
        return AppDataSource.getRepository(User)
    }

    private get messageRepo() {
        return AppDataSource.getRepository(Message)
    }

    private get faqRepo() {
        return AppDataSource.getRepository(Faq)
    }

    async getStats() {
        const [
            totalArticles,
            publishedArticles,
            draftArticles,
            totalCategories,
            totalUsers,
            totalMessages,
            unreadMessages,
            totalFaqs,
            totalViewsRaw,
        ] = await Promise.all([
            this.articleRepo.count(),
            this.articleRepo.count({ where: { status: ArticleStatus.PUBLISH } }),
            this.articleRepo.count({ where: { status: ArticleStatus.DRAFT } }),
            this.categoryRepo.count(),
            this.userRepo.count(),
            this.messageRepo.count(),
            this.messageRepo.count({ where: { isRead: false } }),
            this.faqRepo.count(),
            this.articleRepo
                .createQueryBuilder("a")
                .select("SUM(a.views_count)", "sum")
                .getRawOne(),
        ])

        const totalViews = Number(totalViewsRaw?.sum || 0)

        // 7-day Views & Articles trend
        const viewsTrend: Array<{ date: string; label: string; views: number; articles: number }> = []
        const now = new Date()
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]

        for (let i = 6; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(d.getDate() - i)
            const yyyy = d.getFullYear()
            const mm = String(d.getMonth() + 1).padStart(2, "0")
            const dd = String(d.getDate()).padStart(2, "0")
            const dateStr = `${yyyy}-${mm}-${dd}`
            const start = new Date(`${dateStr}T00:00:00.000Z`)
            const end = new Date(`${dateStr}T23:59:59.999Z`)

            const [viewsCount, articlesCount] = await Promise.all([
                this.articleViewRepo
                    .createQueryBuilder("av")
                    .where("av.viewedAt >= :start AND av.viewedAt <= :end", { start, end })
                    .getCount(),
                this.articleRepo
                    .createQueryBuilder("a")
                    .where("a.createdAt >= :start AND a.createdAt <= :end", { start, end })
                    .getCount(),
            ])

            viewsTrend.push({
                date: dateStr,
                label: `${dd} ${monthNames[d.getMonth()]}`,
                views: viewsCount,
                articles: articlesCount,
            })
        }

        // Articles by Category
        const categoryRows = await this.categoryRepo
            .createQueryBuilder("c")
            .leftJoin("c.articles", "a")
            .select("c.name", "name")
            .addSelect("COUNT(a.id)", "count")
            .groupBy("c.id")
            .addGroupBy("c.name")
            .getRawMany()

        const articlesByCategory = categoryRows.map((r: any) => ({
            name: r.name,
            count: Number(r.count || 0),
        }))

        // Messages trend (last 6 months)
        const messagesTrend: Array<{ month: string; unread: number; read: number }> = []
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
            const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1)
            const start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0)
            const end = new Date(nextMonth.getTime() - 1)

            const [unreadCount, readCount] = await Promise.all([
                this.messageRepo
                    .createQueryBuilder("m")
                    .where("m.createdAt >= :start AND m.createdAt <= :end AND m.isRead = :isRead", {
                        start,
                        end,
                        isRead: false,
                    })
                    .getCount(),
                this.messageRepo
                    .createQueryBuilder("m")
                    .where("m.createdAt >= :start AND m.createdAt <= :end AND m.isRead = :isRead", {
                        start,
                        end,
                        isRead: true,
                    })
                    .getCount(),
            ])

            messagesTrend.push({
                month: monthNames[d.getMonth()],
                unread: unreadCount,
                read: readCount,
            })
        }

        // Recent Articles
        const rawRecentArticles = await this.articleRepo
            .createQueryBuilder("a")
            .leftJoinAndSelect("a.category", "category")
            .leftJoinAndSelect("a.author", "author")
            .orderBy("a.createdAt", "DESC")
            .limit(5)
            .getMany()

        const recentArticles = rawRecentArticles.map((a) => ({
            id: a.id,
            title: a.title,
            slug: a.slug,
            status: a.status,
            cover: a.cover,
            viewsCount: a.viewsCount,
            category: a.category ? { id: a.category.id, name: a.category.name } : null,
            author: a.author ? { id: a.author.id, name: a.author.name } : null,
            createdAt: a.createdAt,
        }))

        // Recent Messages
        const rawRecentMessages = await this.messageRepo
            .createQueryBuilder("m")
            .orderBy("m.createdAt", "DESC")
            .limit(5)
            .getMany()

        const recentMessages = rawRecentMessages.map((m) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            subject: m.subject,
            isRead: m.isRead,
            createdAt: m.createdAt,
        }))

        return {
            summary: {
                totalArticles,
                publishedArticles,
                draftArticles,
                totalViews,
                totalUsers,
                totalCategories,
                totalMessages,
                unreadMessages,
                totalFaqs,
            },
            viewsTrend,
            articlesByCategory,
            messagesTrend,
            recentArticles,
            recentMessages,
        }
    }
}
