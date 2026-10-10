import { z } from "zod"

export const CreateMessageValidator = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    email: z.string().email("Invalid email address").max(255, "Email is too long"),
    phone: z.string().max(50, "Phone number is too long").optional().nullable(),
    subject: z.string().min(1, "Subject is required").max(255, "Subject is too long"),
    message: z.string().min(1, "Message is required"),
})

export type CreateMessageValidator = z.infer<typeof CreateMessageValidator>

export const UpdateMessageStatusValidator = z.object({
    isRead: z.boolean(),
})

export type UpdateMessageStatusValidator = z.infer<typeof UpdateMessageStatusValidator>
