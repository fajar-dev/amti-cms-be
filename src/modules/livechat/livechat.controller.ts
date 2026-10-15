import { Context } from "hono"
import { ApiResponse } from "../../core/helpers/response"
import { BadRequestException } from "../../core/exceptions/base"
import { LiveChatService } from "./livechat.service"
import { LiveChatSerializer } from "./serializers/livechat.serialize"
import type { TicketQueryDto } from "./validators/livechat.validator"

export class LiveChatController {
    constructor(private readonly service: LiveChatService) {}

    private extractVisitorToken(c: Context): string {
        const token = c.req.header("X-Session-Token")
            || c.req.header("X-Chat-Token")
            || c.req.query("token")
        if (!token) {
            throw new BadRequestException("Session token is required")
        }
        return token
    }

    // ── Public Endpoints ─────────────────────────────────────────────────────

    async start(c: Context) {
        const data = c.req.valid("json" as never)
        const { session, initialMessage } = await this.service.startChat(data)
        const serializedSession = await LiveChatSerializer.session(session, true)
        const serializedMessage = initialMessage ? await LiveChatSerializer.message(initialMessage) : null

        return ApiResponse.success(c, {
            session: serializedSession,
            message: serializedMessage
        }, "Chat started successfully", 201)
    }

    async getSession(c: Context) {
        const token = this.extractVisitorToken(c)
        const session = await this.service.getSessionByToken(token)
        const serialized = await LiveChatSerializer.session(session, true)
        return ApiResponse.success(c, serialized, "Session retrieved successfully")
    }

    async getVisitorMessages(c: Context) {
        const token = this.extractVisitorToken(c)
        const { session, messages } = await this.service.getMessagesForVisitor(token)
        const serializedSession = await LiveChatSerializer.session(session, true)
        const serializedMessages = await LiveChatSerializer.messages(messages)

        return ApiResponse.success(c, {
            session: serializedSession,
            messages: serializedMessages
        }, "Messages retrieved successfully")
    }

    async visitorSendMessage(c: Context) {
        const token = this.extractVisitorToken(c)
        const data = c.req.valid("json" as never)
        const message = await this.service.visitorSendMessage(token, data)
        const serialized = await LiveChatSerializer.message(message)

        return ApiResponse.success(c, serialized, "Message sent successfully", 201)
    }

    async visitorUploadMedia(c: Context) {
        const token = this.extractVisitorToken(c)
        const body = await c.req.parseBody()
        const file = body["file"]
        const uploaded = await this.service.uploadVisitorMedia(token, file)

        return ApiResponse.success(c, uploaded, "File uploaded successfully", 201)
    }

    async visitorClose(c: Context) {
        const token = this.extractVisitorToken(c)
        const session = await this.service.visitorCloseChat(token)
        const serialized = await LiveChatSerializer.session(session, true)
        return ApiResponse.success(c, serialized, "Chat closed successfully")
    }

    // ── Staff / CMS Endpoints ────────────────────────────────────────────────

    async getTickets(c: Context) {
        const query = c.req.valid("query" as never) as TicketQueryDto
        const { page, limit, status, sortBy, order } = query
        const search = query.search || query.q
        const assignedToMe = query.assignedToMe === "true" || query.assignedToMe === "1"

        const user = c.get("user")
        const assignedToId = assignedToMe && user ? user.id : undefined

        const { data, total } = await this.service.getTickets({
            page,
            limit,
            status,
            search,
            assignedToId,
            sortBy,
            order
        })

        const serialized = await LiveChatSerializer.sessions(data, false)
        return ApiResponse.paginate(c, serialized, total, page, limit, "Tickets retrieved successfully")
    }

    async getStats(c: Context) {
        const stats = await this.service.getTicketStats()
        return ApiResponse.success(c, stats, "Ticket stats retrieved successfully")
    }

    async getTicketDetail(c: Context) {
        const id = Number(c.req.param("id"))
        const ticket = await this.service.getTicketById(id)
        const serialized = await LiveChatSerializer.session(ticket, false)
        return ApiResponse.success(c, serialized, "Ticket retrieved successfully")
    }

    async getStaffMessages(c: Context) {
        const id = Number(c.req.param("id"))
        const { session, messages } = await this.service.getMessagesForStaff(id)
        const serializedSession = await LiveChatSerializer.session(session, false)
        const serializedMessages = await LiveChatSerializer.messages(messages)

        return ApiResponse.success(c, {
            session: serializedSession,
            messages: serializedMessages
        }, "Messages retrieved successfully")
    }

    async claimTicket(c: Context) {
        const id = Number(c.req.param("id"))
        const user = c.get("user")
        const session = await this.service.claimTicket(id, user)
        const serialized = await LiveChatSerializer.session(session, false)
        return ApiResponse.success(c, serialized, "Ticket claimed successfully")
    }

    async staffSendMessage(c: Context) {
        const id = Number(c.req.param("id"))
        const user = c.get("user")
        const data = c.req.valid("json" as never)
        const message = await this.service.staffSendMessage(id, user, data)
        const serialized = await LiveChatSerializer.message(message)
        return ApiResponse.success(c, serialized, "Message sent successfully", 201)
    }

    async resolveTicket(c: Context) {
        const id = Number(c.req.param("id"))
        const user = c.get("user")
        const session = await this.service.resolveTicket(id, user)
        const serialized = await LiveChatSerializer.session(session, false)
        return ApiResponse.success(c, serialized, "Ticket resolved successfully")
    }

    async staffUploadMedia(c: Context) {
        const body = await c.req.parseBody()
        const file = body["file"]
        const uploaded = await this.service.uploadMedia(file)
        return ApiResponse.success(c, uploaded, "File uploaded successfully", 201)
    }
}
