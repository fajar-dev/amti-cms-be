import { EntityManager, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Category } from "../entities/category.entity"
import { ICategoryRepository } from "../interfaces/category.repository.interface"
import { SortOrder } from "../../../core/interfaces/base.repository.interface"

const SORTABLE_COLUMNS: Record<string, string> = {
    name: "category.name",
    createdAt: "category.created_at",
}

export class TypeOrmCategoryRepository implements ICategoryRepository {
    private get repository(): Repository<Category> {
        return AppDataSource.getRepository(Category)
    }

    async findAll(
        page: number,
        limit: number,
        q: string = "",
        sortBy?: string,
        order: SortOrder = "DESC"
    ): Promise<{ data: Category[]; total: number }> {
        const offset = (page - 1) * limit
        const query = this.repository.createQueryBuilder("category")

        if (q) {
            query.where(
                "(category.name LIKE :q OR category.description LIKE :q)",
                { q: `%${q}%` }
            )
        }

        const total = await query.getCount()
        const orderColumn = (sortBy && SORTABLE_COLUMNS[sortBy]) || "category.id"

        const data = await query
            .orderBy(orderColumn, order)
            .limit(limit)
            .offset(offset)
            .getMany()

        return { data, total }
    }

    async findAllList(): Promise<Category[]> {
        return await this.repository.find({
            order: { name: "ASC" },
        })
    }

    async findById(id: number): Promise<Category | null> {
        return await this.repository.findOneBy({ id })
    }

    async findBySlug(slug: string): Promise<Category | null> {
        return await this.repository.findOneBy({ slug })
    }

    async findByName(name: string): Promise<Category | null> {
        return await this.repository.findOneBy({ name })
    }

    async save(data: Partial<Category>, manager?: EntityManager): Promise<Category> {
        const repo = manager ? manager.getRepository(Category) : this.repository
        return await repo.save(data)
    }

    merge(entity: Category, data: Partial<Category>): Category {
        return this.repository.merge(entity, data)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
