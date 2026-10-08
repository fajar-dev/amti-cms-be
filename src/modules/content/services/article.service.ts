import { Article } from "../entities/article.entity"
import { ArticleView } from "../entities/article-view.entity"
import { IArticleRepository, ArticleListFilters } from "../interfaces/article.repository.interface"
import { ICategoryRepository } from "../interfaces/category.repository.interface"
import { IArticleViewRepository } from "../interfaces/article-view.repository.interface"
import { ArticleStatus } from "../enum/article-status.enum"
import { NotFoundException, BadRequestException } from "../../../core/exceptions/base"
import { SortOrder } from "../../../core/interfaces/base.repository.interface"
import { minio } from "../../../core/helpers/minio"
import crypto from "crypto"

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

export interface CreateArticleDTO {
    title: string
    slug?: string
    categoryId?: number | null
    cover?: string | null
    content: string
    tags?: string[]
    status?: ArticleStatus
    metaTitle?: string | null
    metaDescription?: string | null
    metaKeywords?: string | null
    canonicalUrl?: string | null
    ogTitle?: string | null
    ogDescription?: string | null
    ogImage?: string | null
}

export interface UpdateArticleDTO {
    title?: string
    slug?: string
    categoryId?: number | null
    cover?: string | null
    content?: string
    tags?: string[]
    status?: ArticleStatus
    metaTitle?: string | null
    metaDescription?: string | null
    metaKeywords?: string | null
    canonicalUrl?: string | null
    ogTitle?: string | null
    ogDescription?: string | null
    ogImage?: string | null
}

export interface RecordViewDTO {
    ipAddress?: string | null
    userAgent?: string | null
    referrer?: string | null
    userId?: number | null
}

export class ArticleService {
    constructor(
        private readonly articleRepository: IArticleRepository,
        private readonly categoryRepository: ICategoryRepository,
        private readonly articleViewRepository: IArticleViewRepository
    ) {}

    async getAll(
        page: number,
        limit: number,
        q: string = "",
        filters: ArticleListFilters = {},
        sortBy?: string,
        order?: SortOrder
    ): Promise<{ data: Article[]; total: number }> {
        return await this.articleRepository.findAll(page, limit, q, filters, sortBy, order)
    }

    async getById(id: number): Promise<Article> {
        const article = await this.articleRepository.findByIdWithRelations(id)
        if (!article) {
            throw new NotFoundException("Article not found")
        }
        return article
    }

    async getBySlug(slug: string): Promise<Article> {
        const article = await this.articleRepository.findBySlug(slug)
        if (!article) {
            throw new NotFoundException("Article not found")
        }
        return article
    }

    private async generateUniqueSlug(baseText: string, currentId?: number): Promise<string> {
        let baseSlug = slugify(baseText)
        if (!baseSlug) {
            baseSlug = `article-${crypto.randomBytes(4).toString("hex")}`
        }

        let slug = baseSlug
        let counter = 1

        while (true) {
            const existing = await this.articleRepository.findBySlug(slug)
            if (!existing || (currentId && existing.id === currentId)) {
                return slug
            }
            slug = `${baseSlug}-${counter}`
            counter++
        }
    }

    async create(data: CreateArticleDTO): Promise<Article> {
        if (data.categoryId) {
            const category = await this.categoryRepository.findById(data.categoryId)
            if (!category) {
                throw new BadRequestException("Category not found")
            }
        }

        const slug = await this.generateUniqueSlug(data.slug || data.title)
        const status = data.status || ArticleStatus.DRAFT
        const publishedAt = status === ArticleStatus.PUBLISH ? new Date() : null

        const sanitizedCover = data.cover ? (minio.sanitizePath(data.cover) ?? data.cover) : null

        return await this.articleRepository.save({
            title: data.title,
            slug,
            categoryId: data.categoryId ?? null,
            cover: sanitizedCover,
            content: data.content,
            tags: data.tags || [],
            status,
            metaTitle: data.metaTitle ?? null,
            metaDescription: data.metaDescription ?? null,
            metaKeywords: data.metaKeywords ?? null,
            canonicalUrl: data.canonicalUrl ?? null,
            ogTitle: data.ogTitle ?? null,
            ogDescription: data.ogDescription ?? null,
            ogImage: data.ogImage ?? null,
            viewsCount: 0,
            publishedAt,
        })
    }

    async update(id: number, data: UpdateArticleDTO): Promise<Article> {
        const article = await this.getById(id)

        if (data.categoryId !== undefined) {
            if (data.categoryId !== null) {
                const category = await this.categoryRepository.findById(data.categoryId)
                if (!category) {
                    throw new BadRequestException("Category not found")
                }
            }
            article.categoryId = data.categoryId
        }

        if (data.title !== undefined) {
            article.title = data.title
        }

        if (data.slug !== undefined && data.slug !== article.slug) {
            article.slug = await this.generateUniqueSlug(data.slug, id)
        }

        if (data.cover !== undefined) {
            article.cover = data.cover ? (minio.sanitizePath(data.cover) ?? data.cover) : null
        }

        if (data.content !== undefined) {
            article.content = data.content
        }

        if (data.tags !== undefined) {
            article.tags = data.tags
        }

        if (data.status !== undefined) {
            if (data.status === ArticleStatus.PUBLISH && !article.publishedAt) {
                article.publishedAt = new Date()
            }
            article.status = data.status
        }

        if (data.metaTitle !== undefined) article.metaTitle = data.metaTitle
        if (data.metaDescription !== undefined) article.metaDescription = data.metaDescription
        if (data.metaKeywords !== undefined) article.metaKeywords = data.metaKeywords
        if (data.canonicalUrl !== undefined) article.canonicalUrl = data.canonicalUrl
        if (data.ogTitle !== undefined) article.ogTitle = data.ogTitle
        if (data.ogDescription !== undefined) article.ogDescription = data.ogDescription
        if (data.ogImage !== undefined) article.ogImage = data.ogImage

        return await this.articleRepository.save(article)
    }

    async delete(id: number): Promise<void> {
        await this.getById(id)
        await this.articleRepository.delete(id)
    }

    async recordView(id: number, meta: RecordViewDTO): Promise<ArticleView> {
        const article = await this.getById(id)

        // Increment counter on article
        await this.articleRepository.incrementViews(article.id)

        // Record viewer detail in article_views
        return await this.articleViewRepository.createView({
            articleId: article.id,
            ipAddress: meta.ipAddress || null,
            userAgent: meta.userAgent || null,
            referrer: meta.referrer || null,
            userId: meta.userId || null,
        })
    }

    async getViews(id: number, limit: number = 50): Promise<ArticleView[]> {
        await this.getById(id)
        return await this.articleViewRepository.findByArticleId(id, limit)
    }
}
