import type { ChatSenderType } from "../enum/chat-message.enum"
import type { CreateMessageData } from "./chat-message.repository.interface"
import type { ChatMessage } from "../entities/chat-message.entity"
import { ChatSession } from "../entities/chat-session.entity"
import { ChatTicketStatus } from "../enum/chat-session.enum"

export interface FindTicketsOptions {
    status?: ChatTicketStatus
    search?: string
    assignedToId?: number
    page?: number
    limit?: number
    sortBy?: string
    order?: "ASC" | "DESC"
}

export interface ChatMutationResult {
    session: ChatSession
    message?: ChatMessage
}

export type ChatMutation = (session: ChatSession) => CreateMessageData | undefined

export interface IChatSessionRepository {
    createWithMessage(data: Partial<ChatSession>, message?: Omit<CreateMessageData, "sessionId">): Promise<ChatMutationResult>
    mutate(id: number, mutation: ChatMutation): Promise<ChatMutationResult>
    markRead(id: number, senderType: ChatSenderType): Promise<void>
    findById(id: number): Promise<ChatSession | null>
    findByToken(sessionToken: string): Promise<ChatSession | null>
    findAll(options: FindTicketsOptions): Promise<{ data: ChatSession[]; total: number }>
    countByStatus(): Promise<{ waiting: number; inProgress: number; resolved: number; closed: number }>
}
