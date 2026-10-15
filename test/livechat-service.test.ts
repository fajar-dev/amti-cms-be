import "reflect-metadata"
import { describe, expect, test } from "bun:test"
import { LiveChatService } from "../src/modules/livechat/livechat.service"
import { ChatSession } from "../src/modules/livechat/entities/chat-session.entity"
import { ChatMessage } from "../src/modules/livechat/entities/chat-message.entity"
import { ChatTicketStatus } from "../src/modules/livechat/enum/chat-session.enum"
import { ChatSenderType } from "../src/modules/livechat/enum/chat-message.enum"
import type { IChatSessionRepository, ChatMutation } from "../src/modules/livechat/interfaces/chat-session.repository.interface"
import type { CreateMessageData } from "../src/modules/livechat/interfaces/chat-message.repository.interface"
import { User } from "../src/modules/user/entities/user.entity"
import { StartChatValidator, SendMessageValidator, TicketQueryValidator } from "../src/modules/livechat/validators/livechat.validator"

function fixture(status = ChatTicketStatus.WAITING) {
    const session: ChatSession = Object.assign(new ChatSession(), {
        id: 1, sessionToken: "valid-token", visitorName: "Visitor", status,
        assignedToId: null, unreadCountUser: 0, unreadCountVisitor: 0
    })
    const messages: ChatMessage[] = []
    const repository: IChatSessionRepository = {
        async createWithMessage(data, message) {
            Object.assign(session, data)
            return { session, message: message ? append({ ...message, sessionId: session.id }) : undefined }
        },
        async mutate(_id: number, operation: ChatMutation) {
            const message = operation(session)
            return { session, message: message ? append(message) : undefined }
        },
        async markRead(_id, senderType) {
            if (senderType === ChatSenderType.USER) session.unreadCountVisitor = 0
            else session.unreadCountUser = 0
        },
        async findById() { return session },
        async findByToken(token) { return token === session.sessionToken ? session : null },
        async findAll() { return { data: [session], total: 1 } },
        async countByStatus() { return { waiting: 1, inProgress: 0, resolved: 0, closed: 0 } }
    }
    function append(data: CreateMessageData) {
        const message = Object.assign(new ChatMessage(), data, { id: messages.length + 1 })
        messages.push(message)
        return message
    }
    const service = new LiveChatService(repository, { async findBySessionId() { return messages } })
    const user = Object.assign(new User(), { id: 10, name: "Agent" })
    return { service, session, messages, user }
}

describe("Live chat service regressions", () => {
    test("validates visitor token before upload", async () => {
        const { service } = fixture()
        await expect(service.uploadVisitorMedia("invalid", new File(["hello"], "hello.txt")))
            .rejects.toThrow("Chat session not found")
    })

    test("closed sessions reject visitor upload and both senders", async () => {
        const { service, user, messages } = fixture(ChatTicketStatus.CLOSED)
        await expect(service.uploadVisitorMedia("valid-token", new File(["hello"], "hello.txt"))).rejects.toThrow("ended")
        await expect(service.visitorSendMessage("valid-token", { message: "Hello" })).rejects.toThrow("ended")
        await expect(service.staffSendMessage(1, user, { message: "Hello" })).rejects.toThrow("ended")
        await expect(service.claimTicket(1, user)).rejects.toThrow("ended")
        await expect(service.resolveTicket(1, user)).rejects.toThrow("ended")
        expect(messages).toHaveLength(0)
    })

    test("claim is idempotent and cannot overwrite another agent", async () => {
        const { service, user, session, messages } = fixture()
        await service.claimTicket(1, user)
        await service.claimTicket(1, user)
        expect(messages).toHaveLength(1)
        const other = Object.assign(new User(), { id: 20, name: "Other" })
        await expect(service.claimTicket(1, other)).rejects.toThrow("already assigned")
        expect(session.assignedToId).toBe(user.id)
    })

    test("closing and resolving do not duplicate system messages", async () => {
        const { service, user, messages } = fixture()
        await service.resolveTicket(1, user)
        await service.resolveTicket(1, user)
        await service.visitorCloseChat("valid-token")
        await service.visitorCloseChat("valid-token")
        expect(messages).toHaveLength(2)
    })

    test("reply reopens resolved ticket and updates corresponding unread counter", async () => {
        const { service, session, user } = fixture(ChatTicketStatus.RESOLVED)
        await service.staffSendMessage(1, user, { message: "Answer" })
        expect(session.status).toBe(ChatTicketStatus.IN_PROGRESS)
        expect(session.unreadCountVisitor).toBe(1)
        await service.visitorSendMessage("valid-token", { message: "Thanks" })
        expect(session.unreadCountUser).toBe(1)
    })

    test("lead fields are trimmed before validating minimum lengths", () => {
        expect(StartChatValidator.safeParse({
            visitorName: "  ", visitorEmail: "a@example.com", visitorPhone: "123456", visitorCompany: "Company"
        }).success).toBe(false)
        expect(SendMessageValidator.safeParse({ message: "  " }).success).toBe(false)
        expect(StartChatValidator.parse({
            visitorName: "Visitor", visitorEmail: "a@example.com", visitorPhone: "123456",
            visitorCompany: "Company", initialMessage: "   "
        }).initialMessage).toBe("")
    })

    test("ticket pagination rejects invalid and unbounded requests", () => {
        for (const query of [{ page: "0" }, { limit: "101" }, { page: "NaN" }, { status: "wrong" }]) {
            expect(TicketQueryValidator.safeParse(query).success).toBe(false)
        }
        expect(TicketQueryValidator.parse({}).limit).toBe(20)
    })
})
