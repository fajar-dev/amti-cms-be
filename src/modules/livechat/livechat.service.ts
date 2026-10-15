import crypto from "crypto"
import { NotFoundException, BadRequestException, ConflictException } from "../../core/exceptions/base"
import { minio } from "../../core/helpers/minio"
import { resolveStorageUrl } from "../../core/helpers/storage-url"
import { IChatSessionRepository, FindTicketsOptions } from "./interfaces/chat-session.repository.interface"
import { IChatMessageRepository } from "./interfaces/chat-message.repository.interface"
import { ChatSession } from "./entities/chat-session.entity"
import { ChatTicketStatus } from "./enum/chat-session.enum"
import { ChatMessage } from "./entities/chat-message.entity"
import { ChatSenderType } from "./enum/chat-message.enum"
import { StartChatDto, SendMessageDto } from "./validators/livechat.validator"
import { User } from "../user/entities/user.entity"

export class LiveChatService {
    constructor(
        private readonly sessionRepository: IChatSessionRepository,
        private readonly messageRepository: IChatMessageRepository
    ) {}

    private generateTicketNumber(): string {
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
        const rand = crypto.randomUUID().replace(/-/g, "")
        return `TICK-${dateStr}-${rand}`
    }

    // ── Public / Visitor Operations ──────────────────────────────────────────

    async startChat(dto: StartChatDto): Promise<{ session: ChatSession; initialMessage?: ChatMessage }> {
        const ticketNumber = this.generateTicketNumber()
        const sessionToken = crypto.randomUUID()

        const { session, message: initialMessage } = await this.sessionRepository.createWithMessage({
            ticketNumber,
            sessionToken,
            visitorName: dto.visitorName.trim(),
            visitorEmail: dto.visitorEmail.trim().toLowerCase(),
            visitorPhone: dto.visitorPhone.trim(),
            visitorCompany: dto.visitorCompany.trim(),
            status: ChatTicketStatus.WAITING,
            unreadCountUser: (dto.initialMessage || dto.mediaUrl) ? 1 : 0,
            unreadCountVisitor: 0,
            lastMessageAt: new Date()
        }, dto.initialMessage || dto.mediaUrl ? {
            senderType: ChatSenderType.VISITOR,
            senderName: dto.visitorName.trim(),
            message: dto.initialMessage?.trim() || null,
            mediaUrl: dto.mediaUrl || null,
            mediaType: dto.mediaType || null,
            mediaName: dto.mediaName || null,
            mediaSize: dto.mediaSize || null
        } : undefined)

        return { session, initialMessage }
    }

    async getSessionByToken(sessionToken: string): Promise<ChatSession> {
        const session = await this.sessionRepository.findByToken(sessionToken)
        if (!session) {
            throw new NotFoundException("Chat session not found")
        }
        return session
    }

    async getMessagesForVisitor(sessionToken: string): Promise<{ session: ChatSession; messages: ChatMessage[] }> {
        const session = await this.getSessionByToken(sessionToken)

        await this.sessionRepository.markRead(session.id, ChatSenderType.USER)
        session.unreadCountVisitor = 0

        const messages = await this.messageRepository.findBySessionId(session.id)
        return { session, messages }
    }

    async visitorSendMessage(sessionToken: string, dto: SendMessageDto): Promise<ChatMessage> {
        const existing = await this.getSessionByToken(sessionToken)
        const result = await this.sessionRepository.mutate(existing.id, (session) => {
            this.assertOpen(session)

            // If previously resolved, reopen it
            if (session.status === ChatTicketStatus.RESOLVED) {
                session.status = session.assignedToId ? ChatTicketStatus.IN_PROGRESS : ChatTicketStatus.WAITING
            }

            session.lastMessageAt = new Date()
            session.unreadCountUser += 1

            return {
                sessionId: session.id,
                senderType: ChatSenderType.VISITOR,
                senderName: session.visitorName,
                message: dto.message?.trim() || null,
                mediaUrl: dto.mediaUrl || null,
                mediaType: dto.mediaType || null,
                mediaName: dto.mediaName || null,
                mediaSize: dto.mediaSize || null
            }
        })
        return result.message!
    }

    async visitorCloseChat(sessionToken: string): Promise<ChatSession> {
        const existing = await this.getSessionByToken(sessionToken)
        const result = await this.sessionRepository.mutate(existing.id, (session) => {
            if (session.status === ChatTicketStatus.CLOSED) return undefined
            session.status = ChatTicketStatus.CLOSED

            return {
                sessionId: session.id,
                senderType: ChatSenderType.SYSTEM,
                senderName: "System",
                message: "Visitor has ended the chat."
            }
        })
        return await this.getTicketById(result.session.id)
    }

    // ── Staff / Admin Operations ─────────────────────────────────────────────

    async getTickets(options: FindTicketsOptions): Promise<{ data: ChatSession[]; total: number }> {
        return await this.sessionRepository.findAll(options)
    }

    async getTicketStats(): Promise<{ waiting: number; inProgress: number; resolved: number; closed: number }> {
        return await this.sessionRepository.countByStatus()
    }

    async getTicketById(id: number): Promise<ChatSession> {
        const session = await this.sessionRepository.findById(id)
        if (!session) {
            throw new NotFoundException("Chat ticket not found")
        }
        return session
    }

    async getMessagesForStaff(ticketId: number): Promise<{ session: ChatSession; messages: ChatMessage[] }> {
        const session = await this.getTicketById(ticketId)

        await this.sessionRepository.markRead(session.id, ChatSenderType.VISITOR)
        session.unreadCountUser = 0

        const messages = await this.messageRepository.findBySessionId(session.id)
        return { session, messages }
    }

    async claimTicket(ticketId: number, user: User): Promise<ChatSession> {
        const existing = await this.getTicketById(ticketId)
        const result = await this.sessionRepository.mutate(existing.id, (session) => {
            this.assertOpen(session)

            if (session.assignedToId === user.id && session.status === ChatTicketStatus.IN_PROGRESS) return undefined
            if (session.assignedToId && session.assignedToId !== user.id) {
                throw new ConflictException("Chat ticket is already assigned")
            }
            session.assignedToId = user.id
            session.assignedAt = new Date()
            session.status = ChatTicketStatus.IN_PROGRESS

            return {
                sessionId: session.id,
                senderType: ChatSenderType.SYSTEM,
                senderName: "System",
                message: `${user.name} has joined the conversation.`
            }
        })
        return await this.getTicketById(result.session.id)
    }

    async staffSendMessage(ticketId: number, user: User, dto: SendMessageDto): Promise<ChatMessage> {
        const existing = await this.getTicketById(ticketId)
        const result = await this.sessionRepository.mutate(existing.id, (session) => {
            this.assertOpen(session)

            // Auto-assign if not yet assigned
            if (!session.assignedToId) {
                session.assignedToId = user.id
                session.assignedAt = new Date()
            }

            if (session.status === ChatTicketStatus.WAITING || session.status === ChatTicketStatus.RESOLVED) {
                session.status = ChatTicketStatus.IN_PROGRESS
            }

            session.lastMessageAt = new Date()
            session.unreadCountVisitor += 1

            return {
                sessionId: session.id,
                senderType: ChatSenderType.USER,
                senderId: user.id,
                senderName: user.name,
                message: dto.message?.trim() || null,
                mediaUrl: dto.mediaUrl || null,
                mediaType: dto.mediaType || null,
                mediaName: dto.mediaName || null,
                mediaSize: dto.mediaSize || null
            }
        })
        return result.message!
    }

    async resolveTicket(ticketId: number, user: User): Promise<ChatSession> {
        const existing = await this.getTicketById(ticketId)
        const result = await this.sessionRepository.mutate(existing.id, (session) => {
            this.assertOpen(session)

            if (session.status === ChatTicketStatus.RESOLVED) return undefined
            session.status = ChatTicketStatus.RESOLVED

            return {
                sessionId: session.id,
                senderType: ChatSenderType.SYSTEM,
                senderName: "System",
                message: `${user.name} marked this ticket as resolved.`
            }
        })
        return await this.getTicketById(result.session.id)
    }

    // ── Media Upload ─────────────────────────────────────────────────────────

    async uploadVisitorMedia(sessionToken: string, file: unknown) {
        const session = await this.getSessionByToken(sessionToken)
        this.assertOpen(session)
        return await this.uploadMedia(file)
    }

    private assertOpen(session: ChatSession): void {
        if (session.status === ChatTicketStatus.CLOSED) {
            throw new BadRequestException("This chat session has ended. Please start a new chat.")
        }
    }

    async uploadMedia(file: unknown): Promise<{
        path: string
        url: string
        name: string
        type: string
        size: number
    }> {
        if (!file || !(file instanceof File)) {
            throw new BadRequestException("No file uploaded or invalid file")
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const extension = file.name.split(".").pop() || "bin"
        const objectName = `chat-media/${crypto.randomUUID()}.${extension}`

        await minio.upload(objectName, buffer, file.type)
        const presignedUrl = await resolveStorageUrl(objectName, { passthroughAbsolute: true, fallbackToPath: true })

        return {
            path: objectName,
            url: presignedUrl || objectName,
            name: file.name,
            type: file.type,
            size: file.size
        }
    }
}
