import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { NotFoundException } from "../../../core/exceptions/base"
import { ChatMessage } from "../entities/chat-message.entity"
import { ChatSenderType } from "../enum/chat-message.enum"
import type { CreateMessageData } from "../interfaces/chat-message.repository.interface"
import { ChatSession } from "../entities/chat-session.entity"
import { ChatTicketStatus } from "../enum/chat-session.enum"
import { IChatSessionRepository, FindTicketsOptions, ChatMutation } from "../interfaces/chat-session.repository.interface"

export class TypeOrmChatSessionRepository implements IChatSessionRepository {
    private get repository(): Repository<ChatSession> {
        return AppDataSource.getRepository(ChatSession)
    }

    async findById(id: number): Promise<ChatSession | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ["assignedTo"]
        })
    }

    async findByToken(sessionToken: string): Promise<ChatSession | null> {
        return await this.repository.findOne({
            where: { sessionToken },
            relations: ["assignedTo"]
        })
    }

    async findAll(options: FindTicketsOptions): Promise<{ data: ChatSession[]; total: number }> {
        const {
            status,
            search,
            assignedToId,
            page = 1,
            limit = 20,
            sortBy = "lastMessageAt",
            order = "DESC"
        } = options

        const qb = this.repository.createQueryBuilder("session")
            .leftJoinAndSelect("session.assignedTo", "assignedTo")

        if (status) {
            qb.andWhere("session.status = :status", { status })
        }

        if (assignedToId) {
            qb.andWhere("session.assignedToId = :assignedToId", { assignedToId })
        }

        if (search) {
            qb.andWhere(
                "(session.visitorName LIKE :search OR session.visitorEmail LIKE :search OR session.visitorCompany LIKE :search OR session.ticketNumber LIKE :search OR session.visitorPhone LIKE :search)",
                { search: `%${search}%` }
            )
        }

        const validSortColumns: Record<string, string> = {
            id: "session.id",
            lastMessageAt: "session.lastMessageAt",
            createdAt: "session.createdAt",
            status: "session.status",
            visitorName: "session.visitorName"
        }

        const sortColumn = validSortColumns[sortBy] || "session.lastMessageAt"
        qb.orderBy(sortColumn, order)

        qb.skip((page - 1) * limit).take(limit)

        const [data, total] = await qb.getManyAndCount()
        return { data, total }
    }

    async countByStatus(): Promise<{ waiting: number; inProgress: number; resolved: number; closed: number }> {
        const waiting = await this.repository.count({ where: { status: ChatTicketStatus.WAITING } })
        const inProgress = await this.repository.count({ where: { status: ChatTicketStatus.IN_PROGRESS } })
        const resolved = await this.repository.count({ where: { status: ChatTicketStatus.RESOLVED } })
        const closed = await this.repository.count({ where: { status: ChatTicketStatus.CLOSED } })

        return { waiting, inProgress, resolved, closed }
    }

    async createWithMessage(data: Partial<ChatSession>, message?: Omit<CreateMessageData, "sessionId">) {
        return await AppDataSource.transaction(async (manager) => {
            const session = await manager.save(ChatSession, manager.create(ChatSession, data))
            const initialMessage = message
                ? await manager.save(ChatMessage, manager.create(ChatMessage, { ...message, sessionId: session.id }))
                : undefined
            return { session, message: initialMessage }
        })
    }

    async mutate(id: number, mutation: ChatMutation) {
        return await AppDataSource.transaction(async (manager) => {
            const session = await manager.findOne(ChatSession, {
                where: { id },
                lock: { mode: "pessimistic_write" }
            })
            if (!session) throw new NotFoundException("Chat ticket not found")
            const data = mutation(session)
            await manager.save(ChatSession, session)
            const message = data
                ? await manager.save(ChatMessage, manager.create(ChatMessage, data))
                : undefined
            return { session, message }
        })
    }

    async markRead(id: number, senderType: ChatSenderType): Promise<void> {
        await AppDataSource.transaction(async (manager) => {
            const session = await manager.findOne(ChatSession, {
                where: { id },
                lock: { mode: "pessimistic_write" }
            })
            if (!session) throw new NotFoundException("Chat ticket not found")
            await manager.update(ChatMessage, { sessionId: id, senderType, isRead: false }, { isRead: true })
            if (senderType === ChatSenderType.USER) session.unreadCountVisitor = 0
            else session.unreadCountUser = 0
            await manager.save(ChatSession, session)
        })
    }
}
