import { z } from "zod"

export const CreateFaqValidator = z.object({
    question: z.string().min(1, "Question is required").max(500, "Question is too long"),
    answer: z.string().min(1, "Answer is required"),
    category: z.string().max(100, "Category is too long").nullable().optional(),
    order: z.number().int().default(0).optional(),
    isActive: z.boolean().default(true).optional(),
})

export type CreateFaqValidator = z.infer<typeof CreateFaqValidator>

export const UpdateFaqValidator = z.object({
    question: z.string().min(1, "Question is required").max(500, "Question is too long").optional(),
    answer: z.string().min(1, "Answer is required").optional(),
    category: z.string().max(100, "Category is too long").nullable().optional(),
    order: z.number().int().optional(),
    isActive: z.boolean().optional(),
})

export type UpdateFaqValidator = z.infer<typeof UpdateFaqValidator>
