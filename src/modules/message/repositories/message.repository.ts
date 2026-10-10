import { EntityManager, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Message } from "../entities/message.entity"
import { IMessageRepository, MessageListFilters } from "../interfaces/message.repository.interface"
import { SortOrder } from "../../../core/interfaces/base.repository.interface"

const SORTABLE_COLUMNS: Record<string, string> = {
    name: "message.name",
    email: "message.email",
    subject: "message.subject",
    isRead: "message.is_read",
    createdAt: "message.created_at",
}

export class TypeOrmMessageRepository implements IMessageRepository {
    private get repository(): Repository<Message> {
        return AppDataSource.getRepository(Message)
    }

    async findAll(
        page: number,
        limit: number,
        q: string = "",
        filters: MessageListFilters = {},
        sortBy?: string,
        order: SortOrder = "DESC"
    ): Promise<{ data: Message[]; total: number }> {
        const offset = (page - 1) * limit
        const query = this.repository.createQueryBuilder("message")

        if (q) {
            query.where(
                "(message.name LIKE :q OR message.email LIKE :q OR message.phone LIKE :q OR message.subject LIKE :q OR message.message LIKE :q)",
                { q: `%${q}%` }
            )
        }

        if (filters.isRead !== undefined) {
            query.andWhere("message.is_read = :isRead", { isRead: filters.isRead })
        }

        const total = await query.getCount()

        if (sortBy && SORTABLE_COLUMNS[sortBy]) {
            query.orderBy(SORTABLE_COLUMNS[sortBy], order)
        } else {
            query.orderBy("message.created_at", order).addOrderBy("message.id", "DESC")
        }

        const data = await query
            .offset(offset)
            .limit(limit)
            .getMany()

        return { data, total }
    }

    async findById(id: number): Promise<Message | null> {
        return await this.repository.findOneBy({ id })
    }

    async countUnread(): Promise<number> {
        return await this.repository.countBy({ isRead: false })
    }

    async save(data: Partial<Message>, manager?: EntityManager): Promise<Message> {
        const repo = manager ? manager.getRepository(Message) : this.repository
        return await repo.save(data)
    }

    merge(entity: Message, data: Partial<Message>): Message {
        return this.repository.merge(entity, data)
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
