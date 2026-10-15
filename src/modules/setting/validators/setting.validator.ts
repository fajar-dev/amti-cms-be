import { z } from "zod"

export const UpdateSettingContactValidator = z.object({
    phone: z.string().trim().max(50).nullable().optional(),
    whatsapp: z.string().trim().max(50).nullable().optional(),
    email: z.preprocess(
        (val) => (val === "" ? null : val),
        z.string().trim().email("Invalid email address").max(255).nullable().optional()
    ),
    address: z.string().trim().max(1000).nullable().optional(),
    mapsUrl: z.string().trim().max(2000).nullable().optional(),
})

export const UpdateSettingSocialValidator = z.object({
    facebook: z.string().trim().max(500).nullable().optional(),
    instagram: z.string().trim().max(500).nullable().optional(),
    tiktok: z.string().trim().max(500).nullable().optional(),
    linkedin: z.string().trim().max(500).nullable().optional(),
    twitter: z.string().trim().max(500).nullable().optional(),
    youtube: z.string().trim().max(500).nullable().optional(),
})

export const UpdateSettingValidator = UpdateSettingContactValidator.extend(UpdateSettingSocialValidator.shape)

export type UpdateSettingContactValidator = z.infer<typeof UpdateSettingContactValidator>
export type UpdateSettingSocialValidator = z.infer<typeof UpdateSettingSocialValidator>
export type UpdateSettingValidator = z.infer<typeof UpdateSettingValidator>
