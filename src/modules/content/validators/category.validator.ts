import { z } from "zod"

export const CreateCategoryValidator = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long"),
    slug: z.string().max(255).optional(),
    description: z.string().nullable().optional(),
})

export type CreateCategoryValidator = z.infer<typeof CreateCategoryValidator>

export const UpdateCategoryValidator = z.object({
    name: z.string().min(1, "Name is required").max(255, "Name is too long").optional(),
    slug: z.string().max(255).optional(),
    description: z.string().nullable().optional(),
})

export type UpdateCategoryValidator = z.infer<typeof UpdateCategoryValidator>
