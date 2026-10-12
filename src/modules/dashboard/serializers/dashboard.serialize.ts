import { Article } from "../../content/entities/article.entity"
import { Message } from "../../message/entities/message.entity"
import { resolveStorageUrl } from "../../../core/helpers/storage-url"

export class DashboardSerializer {
    static async recentArticle(article: Article) {
        return {
            id: article.id,
            title: article.title,
            slug: article.slug,
            status: article.status,
            cover: article.cover || null,
            coverUrl: await resolveStorageUrl(article.cover, { passthroughAbsolute: true }),
            viewsCount: Number(article.viewsCount || 0),
            category: article.category ? { id: article.category.id, name: article.category.name } : null,
            author: article.author ? { id: article.author.id, name: article.author.name } : null,
            createdAt: article.createdAt,
        }
    }

    static async recentArticles(articles: Article[]) {
        return Promise.all(articles.map((a) => this.recentArticle(a)))
    }

    static recentMessage(message: Message) {
        return {
            id: message.id,
            name: message.name,
            email: message.email,
            subject: message.subject,
            isRead: Boolean(message.isRead),
            createdAt: message.createdAt,
        }
    }

    static recentMessages(messages: Message[]) {
        return messages.map((m) => this.recentMessage(m))
    }
}
