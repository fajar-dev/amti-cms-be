import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany } from "typeorm"
import { Role } from "./role.entity"

@Entity("permissions")
export class Permission {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ unique: true })
    name!: string

    @Column()
    module!: string

    @Column({ nullable: true })
    description?: string

    @ManyToMany(() => Role, (role) => role.permissions)
    roles?: Role[]

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
