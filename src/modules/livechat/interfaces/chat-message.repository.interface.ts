import { ChatMessage } from "../entities/chat-message.entity"
import { ChatSenderType } from "../enum/chat-message.enum"

export interface CreateMessageData {
    sessionId: number
    senderType: ChatSenderType
    senderId?: number | null
    senderName: string
    message?: string | null
    mediaUrl?: string | null
    mediaType?: string | null
    mediaName?: string | null
    mediaSize?: number | null
}

export interface IChatMessageRepository {
    findBySessionId(sessionId: number, limit?: number): Promise<ChatMessage[]>
}
