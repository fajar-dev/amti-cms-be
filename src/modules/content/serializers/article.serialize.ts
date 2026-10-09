import { Article } from "../entities/article.entity"
import { minio } from "../../../core/helpers/minio"
import { CategorySerializer } from "./category.serialize"

export class ArticleSerializer {
    private static async resolveCoverUrl(cover?: string | null): Promise<string | null> {
        if (!cover) return null
        if (cover.startsWith("http://") || cover.startsWith("https://")) {
            return cover
        }
        return await minio.getPresignedUrl(cover)
    }

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
            coverUrl: await this.resolveCoverUrl(article.cover),
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
}
