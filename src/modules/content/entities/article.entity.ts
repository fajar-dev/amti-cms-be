import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from "typeorm"
import { Category } from "./category.entity"
import type { ArticleView } from "./article-view.entity"
import { ArticleStatus } from "../enum/article-status.enum"

@Entity("articles")
export class Article {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "category_id", nullable: true })
    categoryId?: number | null

    @ManyToOne(() => Category, (category) => category.articles, { onDelete: "SET NULL", nullable: true })
    @JoinColumn({ name: "category_id" })
    category?: Category | null

    @Column({ length: 255 })
    title!: string

    @Column({ length: 255, unique: true })
    slug!: string

    @Column({ type: "varchar", length: 255, nullable: true })
    cover?: string | null

    @Column({ type: "text" })
    content!: string

    @Column({ type: "json", nullable: true })
    tags?: string[] | null

    @Column({
        type: "enum",
        enum: ArticleStatus,
        default: ArticleStatus.DRAFT,
    })
    status!: ArticleStatus

    // ── SEO Fields ─────────────────────────────────────────────────────────────
    @Column({ name: "meta_title", type: "varchar", length: 255, nullable: true })
    metaTitle?: string | null

    @Column({ name: "meta_description", type: "text", nullable: true })
    metaDescription?: string | null

    @Column({ name: "meta_keywords", type: "varchar", length: 255, nullable: true })
    metaKeywords?: string | null

    @Column({ name: "canonical_url", type: "varchar", length: 500, nullable: true })
    canonicalUrl?: string | null

    @Column({ name: "og_title", type: "varchar", length: 255, nullable: true })
    ogTitle?: string | null

    @Column({ name: "og_description", type: "text", nullable: true })
    ogDescription?: string | null

    @Column({ name: "og_image", type: "varchar", length: 255, nullable: true })
    ogImage?: string | null

    // ── Analytics & Metadata ───────────────────────────────────────────────────
    @Column({ name: "views_count", type: "int", default: 0 })
    viewsCount!: number

    @Column({ name: "published_at", type: "timestamp", nullable: true })
    publishedAt?: Date | null

    @OneToMany("ArticleView", "article")
    views?: ArticleView[]

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
