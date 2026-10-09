import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import type { Role } from "../../rbac/entities/role.entity"

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    name!: string

    @Column({ nullable: true })
    photo?: string

    @Column({ unique: true })
    email!: string

    @Column({ select: false, nullable: true })
    password?: string

    @Column({ name: "is_active", default: true })
    isActive!: boolean

    @Column({ name: "role_id", nullable: true })
    roleId?: number | null

    @ManyToOne("Role", "users", { nullable: true, onDelete: "SET NULL" })
    @JoinColumn({ name: "role_id" })
    role?: Role | null

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}

