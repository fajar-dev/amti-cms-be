import { Message } from "../entities/message.entity"

export class MessageSerializer {
    static single(message: Message) {
        return {
            id: message.id,
            name: message.name,
            email: message.email,
            phone: message.phone || null,
            subject: message.subject,
            message: message.message,
            isRead: Boolean(message.isRead),
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
        }
    }

    static collection(messages: Message[]) {
        return messages.map((m) => this.single(m))
    }
}
