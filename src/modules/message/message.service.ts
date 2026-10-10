import { Message } from "./entities/message.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { IMessageRepository, MessageListFilters } from "./interfaces/message.repository.interface"
import { SortOrder } from "../../core/interfaces/base.repository.interface"

export class MessageService {
    constructor(private readonly repository: IMessageRepository) {}

    async getAll(
        page: number,
        limit: number,
        q: string = "",
        filters: MessageListFilters = {},
        sortBy?: string,
        order?: SortOrder
    ): Promise<{ data: Message[]; total: number }> {
        return await this.repository.findAll(page, limit, q, filters, sortBy, order)
    }

    async getById(id: number): Promise<Message> {
        const message = await this.repository.findById(id)
        if (!message) {
            throw new NotFoundException("Message not found")
        }
        return message
    }

    async create(data: Partial<Message>): Promise<Message> {
        return await this.repository.save({
            ...data,
            isRead: false,
        })
    }

    async updateStatus(id: number, isRead: boolean): Promise<Message> {
        const message = await this.getById(id)
        message.isRead = isRead
        return await this.repository.save(message)
    }

    async delete(id: number): Promise<void> {
        await this.getById(id)
        await this.repository.delete(id)
    }

    async getUnreadCount(): Promise<number> {
        return await this.repository.countUnread()
    }
}
