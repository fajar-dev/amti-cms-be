import { EntityManager, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Client } from "../entities/client.entity"
import { IClientRepository, ClientListFilters } from "../interfaces/client.repository.interface"
import { SortOrder } from "../../../core/interfaces/base.repository.interface"

const SORTABLE_COLUMNS: Record<string, string> = {
    name: "client.name",
    order: "client.order",
    isActive: "client.isActive",
    createdAt: "client.createdAt",
}

export class TypeOrmClientRepository implements IClientRepository {
    private get repository(): Repository<Client> {
        return AppDataSource.getRepository(Client)
    }

    async findAll(
        page: number,
        limit: number,
        q: string = "",
        filters: ClientListFilters = {},
        sortBy?: string,
        order: SortOrder = "ASC"
    ): Promise<{ data: Client[]; total: number }> {
        const offset = (page - 1) * limit
        const query = this.repository.createQueryBuilder("client")

        if (q) {
            query.where(
                "(client.name LIKE :q OR client.website LIKE :q)",
                { q: `%${q}%` }
            )
        }

        if (filters.isActive !== undefined) {
            query.andWhere("client.isActive = :isActive", { isActive: filters.isActive })
        }

        const total = await query.getCount()

        if (sortBy && SORTABLE_COLUMNS[sortBy]) {
            query.orderBy(SORTABLE_COLUMNS[sortBy], order)
        } else {
            query.orderBy("client.order", "ASC").addOrderBy("client.id", "ASC")
        }

        const data = await query
            .offset(offset)
            .limit(limit)
            .getMany()

        return { data, total }
    }

    async findById(id: number): Promise<Client | null> {
        return await this.repository.findOneBy({ id })
    }

    async save(data: Partial<Client>, manager?: EntityManager): Promise<Client> {
        const repo = manager ? manager.getRepository(Client) : this.repository
        return await repo.save(data)
    }

    merge(entity: Client, data: Partial<Client>): Client {
        return this.repository.merge(entity, data)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
