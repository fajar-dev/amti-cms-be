import { Article } from "../entities/article.entity"
import { resolveStorageUrl } from "../../../core/helpers/storage-url"
import { CategorySerializer } from "./category.serialize"

export class ArticleSerializer {
    static async single(article: Article) {
        return {
            id: article.id,
            authorId: article.authorId || null,
            author: article.author
                ? {
                    id: article.author.id,
                    name: article.author.name,
                    email: article.author.email,
                    photo: article.author.photo || null,
                }
                : null,
            categoryId: article.categoryId || null,
            category: article.category ? CategorySerializer.single(article.category) : null,
            title: article.title,
            slug: article.slug,
            cover: article.cover || null,
            coverUrl: await resolveStorageUrl(article.cover, { passthroughAbsolute: true }),
            content: article.content,
            tags: Array.isArray(article.tags) ? article.tags : [],
            status: article.status,
            description: article.description || null,
            viewsCount: Number(article.viewsCount || 0),
            publishedAt: article.publishedAt || null,
            createdAt: article.createdAt,
            updatedAt: article.updatedAt,
        }
    }

    static async collection(articles: Article[]) {
        return Promise.all(articles.map((a) => this.single(a)))
    }

    static async publicCard(article: Article) {
        return {
            id: article.id,
            title: article.title,
            slug: article.slug,
            description: article.description || null,
            cover: article.cover || null,
            coverUrl: await resolveStorageUrl(article.cover, { passthroughAbsolute: true }),
            tags: Array.isArray(article.tags) ? article.tags : [],
            category: article.category ? CategorySerializer.single(article.category) : null,
            author: article.author ? { id: article.author.id, name: article.author.name } : null,
            publishedAt: article.publishedAt || null,
            createdAt: article.createdAt,
        }
    }

    static async publicCollection(articles: Article[]) {
        return Promise.all(articles.map((a) => this.publicCard(a)))
    }
}
