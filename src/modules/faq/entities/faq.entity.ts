import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm"

@Entity("faqs")
export class Faq {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ length: 500 })
    question!: string

    @Column({ type: "text" })
    answer!: string

    @Column({ type: "int", default: 0 })
    order!: number

    @Column({ name: "is_active", default: true })
    isActive!: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
