import { Message } from "../entities/message.entity"
import { IBaseRepository, SortOrder } from "../../../core/interfaces/base.repository.interface"

export interface MessageListFilters {
    isRead?: boolean
}

export interface IMessageRepository extends IBaseRepository<Message> {
    findAll(
        page: number,
        limit: number,
        q?: string,
        filters?: MessageListFilters,
        sortBy?: string,
        order?: SortOrder
    ): Promise<{ data: Message[]; total: number }>
    findById(id: number): Promise<Message | null>
    countUnread(): Promise<number>
}
