import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index
} from "typeorm"
import { ChatSession } from "./chat-session.entity"

import { ChatSenderType } from "../enum/chat-message.enum"

@Entity("chat_messages")
export class ChatMessage {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "session_id", type: "int" })
    sessionId!: number

    @ManyToOne(() => ChatSession, (session) => session.messages, { onDelete: "CASCADE" })
    @JoinColumn({ name: "session_id" })
    session!: ChatSession

    @Column({
        name: "sender_type",
        type: "enum",
        enum: ChatSenderType
    })
    senderType!: ChatSenderType

    @Column({ name: "sender_id", type: "int", nullable: true })
    senderId!: number | null

    @Column({ name: "sender_name", type: "varchar", length: 150 })
    senderName!: string

    @Column({ type: "text", nullable: true })
    message!: string | null

    @Column({ name: "media_url", type: "varchar", length: 500, nullable: true })
    mediaUrl!: string | null

    @Column({ name: "media_type", type: "varchar", length: 100, nullable: true })
    mediaType!: string | null

    @Column({ name: "media_name", type: "varchar", length: 255, nullable: true })
    mediaName!: string | null

    @Column({ name: "media_size", type: "int", nullable: true })
    mediaSize!: number | null

    @Column({ name: "is_read", type: "boolean", default: false })
    isRead!: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date
}
