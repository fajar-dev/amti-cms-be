import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm"

@Entity("messages")
export class Message {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ length: 255 })
    name!: string

    @Column({ length: 255 })
    email!: string

    @Column({ length: 50, nullable: true })
    phone!: string | null

    @Column({ length: 255 })
    subject!: string

    @Column({ type: "text" })
    message!: string

    @Column({ name: "is_read", default: false })
    isRead!: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
