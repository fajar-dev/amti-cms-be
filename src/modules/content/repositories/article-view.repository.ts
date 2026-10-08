import { EntityManager, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { ArticleView } from "../entities/article-view.entity"
import { IArticleViewRepository } from "../interfaces/article-view.repository.interface"

export class TypeOrmArticleViewRepository implements IArticleViewRepository {
    private get repository(): Repository<ArticleView> {
        return AppDataSource.getRepository(ArticleView)
    }

    async findById(id: number): Promise<ArticleView | null> {
        return await this.repository.findOneBy({ id })
    }

    async createView(data: Partial<ArticleView>): Promise<ArticleView> {
        const view = this.repository.create(data)
        return await this.repository.save(view)
    }

    async findByArticleId(articleId: number, limit: number = 50): Promise<ArticleView[]> {
        return await this.repository.find({
            where: { articleId },
            order: { viewedAt: "DESC" },
            take: limit,
        })
    }

    async countByArticleId(articleId: number): Promise<number> {
        return await this.repository.count({
            where: { articleId },
        })
    }

    async save(data: Partial<ArticleView>, manager?: EntityManager): Promise<ArticleView> {
        const repo = manager ? manager.getRepository(ArticleView) : this.repository
        return await repo.save(data)
    }

    merge(entity: ArticleView, data: Partial<ArticleView>): ArticleView {
        return this.repository.merge(entity, data)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
