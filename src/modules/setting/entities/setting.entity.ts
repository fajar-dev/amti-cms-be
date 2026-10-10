import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm"

@Entity("settings")
export class Setting {
    @PrimaryGeneratedColumn()
    id!: number

    // ── Website Meta ────────────────────────────────────────────────────────────
    @Column({ type: "varchar", length: 255, name: "site_name", default: "AMTI" })
    siteName!: string

    @Column({ type: "text", nullable: true, name: "site_description" })
    siteDescription?: string | null

    @Column({ type: "text", nullable: true, name: "meta_keywords" })
    metaKeywords?: string | null

    @Column({ type: "varchar", length: 255, nullable: true, name: "author" })
    author?: string | null

    @Column({ type: "varchar", length: 255, nullable: true, name: "copyright" })
    copyright?: string | null

    @Column({ type: "varchar", length: 500, nullable: true, name: "logo" })
    logo?: string | null

    @Column({ type: "varchar", length: 500, nullable: true, name: "favicon" })
    favicon?: string | null

    @Column({ type: "varchar", length: 500, nullable: true, name: "og_image" })
    ogImage?: string | null

    // ── Contact Information ─────────────────────────────────────────────────────
    @Column({ type: "varchar", length: 50, nullable: true, name: "phone" })
    phone?: string | null

    @Column({ type: "varchar", length: 255, nullable: true, name: "email" })
    email?: string | null

    @Column({ type: "text", nullable: true, name: "address" })
    address?: string | null

    // ── Social Media ───────────────────────────────────────────────────────────
    @Column({ type: "varchar", length: 500, nullable: true, name: "facebook" })
    facebook?: string | null

    @Column({ type: "varchar", length: 500, nullable: true, name: "instagram" })
    instagram?: string | null

    @Column({ type: "varchar", length: 500, nullable: true, name: "tiktok" })
    tiktok?: string | null

    @Column({ type: "varchar", length: 500, nullable: true, name: "linkedin" })
    linkedin?: string | null

    @Column({ type: "varchar", length: 500, nullable: true, name: "twitter" })
    twitter?: string | null

    @Column({ type: "varchar", length: 500, nullable: true, name: "youtube" })
    youtube?: string | null

    // ── Timestamps ─────────────────────────────────────────────────────────────
    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
