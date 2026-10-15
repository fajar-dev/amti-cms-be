import { z } from "zod"
import { ChatTicketStatus } from "../enum/chat-session.enum"

export const StartChatValidator = z.object({
    visitorName: z.string().trim().min(2, "Name must be at least 2 characters").max(150),
    visitorEmail: z.string().trim().email("Invalid email address").max(150),
    visitorPhone: z.string().trim().min(6, "Phone number must be at least 6 characters").max(50),
    visitorCompany: z.string().trim().min(2, "Company name must be at least 2 characters").max(150),
    initialMessage: z.string().trim().max(2000).optional(),
    mediaUrl: z.string().max(500).optional(),
    mediaType: z.string().max(100).optional(),
    mediaName: z.string().max(255).optional(),
    mediaSize: z.number().int().positive().optional()
})

export const SendMessageValidator = z.object({
    message: z.string().trim().max(2000).optional().nullable(),
    mediaUrl: z.string().max(500).optional().nullable(),
    mediaType: z.string().max(100).optional().nullable(),
    mediaName: z.string().max(255).optional().nullable(),
    mediaSize: z.number().int().positive().optional().nullable()
}).refine((data) => (data.message && data.message.trim().length > 0) || Boolean(data.mediaUrl), {
    message: "Either message or media attachment is required"
})

export type StartChatDto = z.infer<typeof StartChatValidator>
export type SendMessageDto = z.infer<typeof SendMessageValidator>

export const TicketQueryValidator = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(ChatTicketStatus).optional(),
    q: z.string().trim().optional(),
    search: z.string().trim().optional(),
    assignedToMe: z.enum(["true", "false", "1", "0"]).optional(),
    sortBy: z.enum(["id", "lastMessageAt", "createdAt", "status", "visitorName"]).default("lastMessageAt"),
    order: z.string().toUpperCase().pipe(z.enum(["ASC", "DESC"])).default("DESC")
})

export const TicketIdValidator = z.object({
    id: z.coerce.number().int().positive()
})

export type TicketQueryDto = z.infer<typeof TicketQueryValidator>
