import { EntityManager, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Article } from "../entities/article.entity"
import { IArticleRepository, ArticleListFilters } from "../interfaces/article.repository.interface"
import { SortOrder } from "../../../core/interfaces/base.repository.interface"

const SORTABLE_COLUMNS: Record<string, string> = {
    title: "article.title",
    status: "article.status",
    viewsCount: "article.views_count",
    createdAt: "article.created_at",
    publishedAt: "article.published_at",
}

export class TypeOrmArticleRepository implements IArticleRepository {
    private get repository(): Repository<Article> {
        return AppDataSource.getRepository(Article)
    }

    async findAll(
        page: number,
        limit: number,
        q: string = "",
        filters: ArticleListFilters = {},
        sortBy?: string,
        order: SortOrder = "DESC"
    ): Promise<{ data: Article[]; total: number }> {
        const offset = (page - 1) * limit
        const query = this.repository
            .createQueryBuilder("article")
            .leftJoinAndSelect("article.category", "category")

        if (q) {
            query.where(
                "(article.title LIKE :q OR article.content LIKE :q)",
                { q: `%${q}%` }
            )
        }

        if (filters.categoryId) {
            query.andWhere("article.category_id = :categoryId", { categoryId: filters.categoryId })
        }

        if (filters.status) {
            query.andWhere("article.status = :status", { status: filters.status })
        }

        const total = await query.getCount()
        const orderColumn = (sortBy && SORTABLE_COLUMNS[sortBy]) || "article.id"

        const data = await query
            .orderBy(orderColumn, order)
            .limit(limit)
            .offset(offset)
            .getMany()

        return { data, total }
    }

    async findById(id: number): Promise<Article | null> {
        return await this.repository.findOneBy({ id })
    }

    async findByIdWithRelations(id: number): Promise<Article | null> {
        return await this.repository
            .createQueryBuilder("article")
            .leftJoinAndSelect("article.category", "category")
            .where("article.id = :id", { id })
            .getOne()
    }

    async findBySlug(slug: string): Promise<Article | null> {
        return await this.repository
            .createQueryBuilder("article")
            .leftJoinAndSelect("article.category", "category")
            .where("article.slug = :slug", { slug })
            .getOne()
    }

    async incrementViews(id: number): Promise<void> {
        await this.repository
            .createQueryBuilder()
            .update(Article)
            .set({ viewsCount: () => "views_count + 1" })
            .where("id = :id", { id })
            .execute()
    }

    async save(data: Partial<Article>, manager?: EntityManager): Promise<Article> {
        const repo = manager ? manager.getRepository(Article) : this.repository
        return await repo.save(data)
    }

    merge(entity: Article, data: Partial<Article>): Article {
        return this.repository.merge(entity, data)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
