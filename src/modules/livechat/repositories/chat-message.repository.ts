import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { ChatMessage } from "../entities/chat-message.entity"
import { IChatMessageRepository } from "../interfaces/chat-message.repository.interface"

export class TypeOrmChatMessageRepository implements IChatMessageRepository {
    private get repository(): Repository<ChatMessage> {
        return AppDataSource.getRepository(ChatMessage)
    }

    async findBySessionId(sessionId: number, limit = 200): Promise<ChatMessage[]> {
        const messages = await this.repository.find({
            where: { sessionId },
            order: { createdAt: "DESC", id: "DESC" },
            take: limit
        })
        return messages.reverse()
    }

}
