import { ArticleView } from "../entities/article-view.entity"
import { IBaseRepository } from "../../../core/interfaces/base.repository.interface"

export interface IArticleViewRepository extends IBaseRepository<ArticleView> {
    createView(data: Partial<ArticleView>): Promise<ArticleView>
    findByArticleId(articleId: number, limit?: number): Promise<ArticleView[]>
    countByArticleId(articleId: number): Promise<number>
}
