import { z } from "zod"

export const CreateRoleValidator = z.object({
    name: z.string("Role name is required")
        .min(2, "Role identifier must be at least 2 characters")
        .max(100, "Role identifier cannot exceed 100 characters")
        .regex(/^[a-z0-9_-]+$/, "Role identifier can only contain lowercase letters, numbers, hyphens, and underscores"),
    displayName: z.string("Display name is required")
        .min(2, "Display name must be at least 2 characters")
        .max(150, "Display name cannot exceed 150 characters"),
    description: z.string().max(500).optional().nullable(),
    permissionIds: z.array(z.number().int().positive()).optional().default([]),
})

export const UpdateRoleValidator = z.object({
    name: z.string()
        .min(2, "Role identifier must be at least 2 characters")
        .max(100, "Role identifier cannot exceed 100 characters")
        .regex(/^[a-z0-9_-]+$/, "Role identifier can only contain lowercase letters, numbers, hyphens, and underscores")
        .optional(),
    displayName: z.string()
        .min(2, "Display name must be at least 2 characters")
        .max(150, "Display name cannot exceed 150 characters")
        .optional(),
    description: z.string().max(500).optional().nullable(),
    permissionIds: z.array(z.number().int().positive()).optional(),
})
