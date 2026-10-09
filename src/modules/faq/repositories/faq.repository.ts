import { EntityManager, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Faq } from "../entities/faq.entity"
import { IFaqRepository, FaqListFilters } from "../interfaces/faq.repository.interface"
import { SortOrder } from "../../../core/interfaces/base.repository.interface"

const SORTABLE_COLUMNS: Record<string, string> = {
    question: "faq.question",
    order: "faq.order",
    isActive: "faq.is_active",
    createdAt: "faq.created_at",
}

export class TypeOrmFaqRepository implements IFaqRepository {
    private get repository(): Repository<Faq> {
        return AppDataSource.getRepository(Faq)
    }

    async findAll(
        page: number,
        limit: number,
        q: string = "",
        filters: FaqListFilters = {},
        sortBy?: string,
        order: SortOrder = "ASC"
    ): Promise<{ data: Faq[]; total: number }> {
        const offset = (page - 1) * limit
        const query = this.repository.createQueryBuilder("faq")

        if (q) {
            query.where(
                "(faq.question LIKE :q OR faq.answer LIKE :q)",
                { q: `%${q}%` }
            )
        }

        if (filters.isActive !== undefined) {
            query.andWhere("faq.is_active = :isActive", { isActive: filters.isActive })
        }

        const total = await query.getCount()

        if (sortBy && SORTABLE_COLUMNS[sortBy]) {
            query.orderBy(SORTABLE_COLUMNS[sortBy], order)
        } else {
            query.orderBy("faq.order", "ASC").addOrderBy("faq.id", "ASC")
        }

        const data = await query
            .offset(offset)
            .limit(limit)
            .getMany()

        return { data, total }
    }

    async findById(id: number): Promise<Faq | null> {
        return await this.repository.findOneBy({ id })
    }

    async save(data: Partial<Faq>, manager?: EntityManager): Promise<Faq> {
        const repo = manager ? manager.getRepository(Faq) : this.repository
        return await repo.save(data)
    }

    merge(entity: Faq, data: Partial<Faq>): Faq {
        return this.repository.merge(entity, data)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
