import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index
} from "typeorm"
import { User } from "../../user/entities/user.entity"
import type { ChatMessage } from "./chat-message.entity"

import { ChatTicketStatus } from "../enum/chat-session.enum"

@Entity("chat_sessions")
export class ChatSession {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ name: "ticket_number", type: "varchar", length: 50, unique: true })
    ticketNumber!: string

    @Column({ name: "session_token", type: "varchar", length: 100, unique: true })
    sessionToken!: string

    @Column({ name: "visitor_name", type: "varchar", length: 150 })
    visitorName!: string

    @Column({ name: "visitor_email", type: "varchar", length: 150 })
    visitorEmail!: string

    @Column({ name: "visitor_phone", type: "varchar", length: 50 })
    visitorPhone!: string

    @Column({ name: "visitor_company", type: "varchar", length: 150 })
    visitorCompany!: string

    @Index()
    @Column({
        type: "enum",
        enum: ChatTicketStatus,
        default: ChatTicketStatus.WAITING
    })
    status!: ChatTicketStatus

    @Column({ name: "assigned_to_id", type: "int", nullable: true })
    assignedToId!: number | null

    @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "assigned_to_id" })
    assignedTo!: User | null

    @Column({ name: "assigned_at", type: "timestamp", nullable: true })
    assignedAt!: Date | null

    @Column({ name: "last_message_at", type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
    lastMessageAt!: Date

    @Column({ name: "unread_count_user", type: "int", default: 0 })
    unreadCountUser!: number

    @Column({ name: "unread_count_visitor", type: "int", default: 0 })
    unreadCountVisitor!: number

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date

    @OneToMany("ChatMessage", "session")
    messages!: ChatMessage[]
}
