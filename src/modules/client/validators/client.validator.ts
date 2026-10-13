import { z } from "zod"

export const CreateClientValidator = z.object({
    name: z.string().trim().min(1, "Client name is required").max(255),
    logo: z.string().trim().min(1, "Client logo is required").max(500),
    website: z
        .preprocess(
            (val) => (val === "" ? null : val),
            z.string().trim().url("Invalid website URL").max(500).nullable().optional()
        ),
    order: z.number().int().optional().default(0),
    isActive: z.boolean().optional().default(true),
})

export const UpdateClientValidator = z.object({
    name: z.string().trim().min(1, "Client name is required").max(255).optional(),
    logo: z.string().trim().min(1, "Client logo is required").max(500).optional(),
    website: z
        .preprocess(
            (val) => (val === "" ? null : val),
            z.string().trim().url("Invalid website URL").max(500).nullable().optional()
        ),
    order: z.number().int().optional(),
    isActive: z.boolean().optional(),
})

export type CreateClientValidator = z.infer<typeof CreateClientValidator>
export type UpdateClientValidator = z.infer<typeof UpdateClientValidator>
