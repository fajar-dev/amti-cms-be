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
            categoryId: article.categoryId || null,
            category: article.category ? CategorySerializer.single(article.category) : null,
            title: article.title,
            slug: article.slug,
            cover: article.cover || null,
            coverUrl: await this.resolveCoverUrl(article.cover),
            content: article.content,
            tags: Array.isArray(article.tags) ? article.tags : [],
            status: article.status,
            metaTitle: article.metaTitle || null,
            metaDescription: article.metaDescription || null,
            metaKeywords: article.metaKeywords || null,
            canonicalUrl: article.canonicalUrl || null,
            ogTitle: article.ogTitle || null,
            ogDescription: article.ogDescription || null,
            ogImage: article.ogImage || null,
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
