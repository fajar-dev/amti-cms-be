import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, Index } from "typeorm"
import type { Article } from "./article.entity"

@Entity("categories")
export class Category {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ length: 255 })
    name!: string

    @Column({ length: 255, unique: true })
    slug!: string

    @Column({ type: "text", nullable: true })
    description?: string | null

    @OneToMany("Article", "category")
    articles?: Article[]

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
