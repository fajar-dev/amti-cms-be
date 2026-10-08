import { Article } from "../entities/article.entity"
import { ArticleStatus } from "../enum/article-status.enum"
import { IBaseRepository, SortOrder } from "../../../core/interfaces/base.repository.interface"

export interface ArticleListFilters {
    categoryId?: number
    status?: ArticleStatus
}

export interface IArticleRepository extends IBaseRepository<Article> {
    findAll(
        page: number,
        limit: number,
        q?: string,
        filters?: ArticleListFilters,
        sortBy?: string,
        order?: SortOrder
    ): Promise<{ data: Article[]; total: number }>
    findBySlug(slug: string): Promise<Article | null>
    findByIdWithRelations(id: number): Promise<Article | null>
    incrementViews(id: number): Promise<void>
}
