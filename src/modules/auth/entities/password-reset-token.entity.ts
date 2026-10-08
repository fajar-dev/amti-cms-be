import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from "typeorm"

@Entity("password_reset_tokens")
export class PasswordResetToken {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ length: 255 })
    email!: string

    @Index()
    @Column({ length: 255 })
    token!: string

    @Column({ name: "expires_at", type: "timestamp" })
    expiresAt!: Date

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
