import { resolveStorageUrl } from "../../../core/helpers/storage-url"
import { ChatSession } from "../entities/chat-session.entity"
import { ChatMessage } from "../entities/chat-message.entity"

export class LiveChatSerializer {
    static async session(session: ChatSession, includeToken = false) {
        return {
            id: session.id,
            ticketNumber: session.ticketNumber,
            ...(includeToken && { sessionToken: session.sessionToken }),
            visitorName: session.visitorName,
            visitorEmail: session.visitorEmail,
            visitorPhone: session.visitorPhone,
            visitorCompany: session.visitorCompany,
            status: session.status,
            assignedToId: session.assignedToId,
            assignedTo: session.assignedTo ? {
                id: session.assignedTo.id,
                name: session.assignedTo.name,
                email: session.assignedTo.email,
                avatarUrl: await resolveStorageUrl(session.assignedTo.photo, { passthroughAbsolute: true, fallbackToPath: true })
            } : null,
            assignedAt: session.assignedAt,
            lastMessageAt: session.lastMessageAt,
            unreadCountUser: session.unreadCountUser,
            unreadCountVisitor: session.unreadCountVisitor,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt
        }
    }

    static async sessions(sessions: ChatSession[], includeToken = false) {
        return await Promise.all(sessions.map((s) => this.session(s, includeToken)))
    }

    static async message(msg: ChatMessage) {
        let resolvedMediaUrl = null
        if (msg.mediaUrl) {
            resolvedMediaUrl = await resolveStorageUrl(msg.mediaUrl, {
                passthroughAbsolute: true,
                fallbackToPath: true
            })
        }

        return {
            id: msg.id,
            sessionId: msg.sessionId,
            senderType: msg.senderType,
            senderId: msg.senderId,
            senderName: msg.senderName,
            message: msg.message,
            mediaUrl: resolvedMediaUrl,
            mediaType: msg.mediaType,
            mediaName: msg.mediaName,
            mediaSize: msg.mediaSize,
            isRead: msg.isRead,
            createdAt: msg.createdAt
        }
    }

    static async messages(messages: ChatMessage[]) {
        return await Promise.all(messages.map((m) => this.message(m)))
    }
}
