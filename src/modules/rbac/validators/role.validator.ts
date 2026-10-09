import { z } from "zod"

export const CreateRoleValidator = z.object({
    name: z.string("Role name is required")
        .min(2, "Role name must be at least 2 characters")
        .max(100, "Role name cannot exceed 100 characters"),
    description: z.string().max(500).optional().nullable(),
    permissionIds: z.array(z.number().int().positive()).optional().default([]),
})

export const UpdateRoleValidator = z.object({
    name: z.string()
        .min(2, "Role name must be at least 2 characters")
        .max(100, "Role name cannot exceed 100 characters")
        .optional(),
    description: z.string().max(500).optional().nullable(),
    permissionIds: z.array(z.number().int().positive()).optional(),
})
