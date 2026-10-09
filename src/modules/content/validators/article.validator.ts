import { z } from "zod"
import { ArticleStatus } from "../enum/article-status.enum"

export const CreateArticleValidator = z.object({
    title: z.string().min(1, "Title is required").max(255, "Title is too long"),
    slug: z.string().max(255).optional(),
    authorId: z.number().nullable().optional(),
    categoryId: z.number().nullable().optional(),
    cover: z.string().nullable().optional(),
    content: z.string().min(1, "Content is required"),
    tags: z.array(z.string()).optional().default([]),
    status: z.nativeEnum(ArticleStatus).default(ArticleStatus.DRAFT),
    description: z.string().nullable().optional(),
})

export type CreateArticleValidator = z.infer<typeof CreateArticleValidator>

export const UpdateArticleValidator = z.object({
    title: z.string().min(1, "Title is required").max(255, "Title is too long").optional(),
    slug: z.string().max(255).optional(),
    authorId: z.number().nullable().optional(),
    categoryId: z.number().nullable().optional(),
    cover: z.string().nullable().optional(),
    content: z.string().min(1, "Content is required").optional(),
    tags: z.array(z.string()).optional(),
    status: z.nativeEnum(ArticleStatus).optional(),
    description: z.string().nullable().optional(),
})

export type UpdateArticleValidator = z.infer<typeof UpdateArticleValidator>

export const RecordViewValidator = z.object({
    referrer: z.string().max(500).nullable().optional(),
})

export type RecordViewValidator = z.infer<typeof RecordViewValidator>
