import { z } from "zod"

export const UpdateSettingMetaValidator = z.object({
    siteName: z.string().trim().min(1, "Site name is required").max(255),
    siteDescription: z.string().trim().max(2000).nullable().optional(),
    metaKeywords: z.string().trim().max(1000).nullable().optional(),
    author: z.string().trim().max(255).nullable().optional(),
    copyright: z.string().trim().max(255).nullable().optional(),
    logo: z.string().trim().max(500).nullable().optional(),
    favicon: z.string().trim().max(500).nullable().optional(),
    ogImage: z.string().trim().max(500).nullable().optional(),
})

export const UpdateSettingContactValidator = z.object({
    phone: z.string().trim().max(50).nullable().optional(),
    email: z.preprocess(
        (val) => (val === "" ? null : val),
        z.string().trim().email("Invalid email address").max(255).nullable().optional()
    ),
    address: z.string().trim().max(1000).nullable().optional(),
})

export const UpdateSettingSocialValidator = z.object({
    facebook: z.string().trim().max(500).nullable().optional(),
    instagram: z.string().trim().max(500).nullable().optional(),
    tiktok: z.string().trim().max(500).nullable().optional(),
    linkedin: z.string().trim().max(500).nullable().optional(),
    twitter: z.string().trim().max(500).nullable().optional(),
    youtube: z.string().trim().max(500).nullable().optional(),
})

export const UpdateSettingValidator = z.object({
    siteName: z.string().trim().min(1, "Site name is required").max(255).optional(),
    siteDescription: z.string().trim().max(2000).nullable().optional(),
    metaKeywords: z.string().trim().max(1000).nullable().optional(),
    author: z.string().trim().max(255).nullable().optional(),
    copyright: z.string().trim().max(255).nullable().optional(),
    logo: z.string().trim().max(500).nullable().optional(),
    favicon: z.string().trim().max(500).nullable().optional(),
    ogImage: z.string().trim().max(500).nullable().optional(),
    phone: z.string().trim().max(50).nullable().optional(),
    email: z.preprocess(
        (val) => (val === "" ? null : val),
        z.string().trim().email("Invalid email address").max(255).nullable().optional()
    ),
    address: z.string().trim().max(1000).nullable().optional(),
    facebook: z.string().trim().max(500).nullable().optional(),
    instagram: z.string().trim().max(500).nullable().optional(),
    tiktok: z.string().trim().max(500).nullable().optional(),
    linkedin: z.string().trim().max(500).nullable().optional(),
    twitter: z.string().trim().max(500).nullable().optional(),
    youtube: z.string().trim().max(500).nullable().optional(),
})

export type UpdateSettingMetaValidator = z.infer<typeof UpdateSettingMetaValidator>
export type UpdateSettingContactValidator = z.infer<typeof UpdateSettingContactValidator>
export type UpdateSettingSocialValidator = z.infer<typeof UpdateSettingSocialValidator>
export type UpdateSettingValidator = z.infer<typeof UpdateSettingValidator>
