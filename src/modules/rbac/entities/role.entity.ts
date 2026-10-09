import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany } from "typeorm"
import { Permission } from "./permission.entity"
import { User } from "../../user/entities/user.entity"

@Entity("roles")
export class Role {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ unique: true })
    name!: string

    @Column({ name: "display_name" })
    displayName!: string

    @Column({ nullable: true })
    description?: string

    @Column({ name: "is_system", default: false })
    isSystem!: boolean

    @ManyToMany(() => Permission, (permission) => permission.roles)
    @JoinTable({
        name: "role_permissions",
        joinColumn: { name: "role_id", referencedColumnName: "id" },
        inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" }
    })
    permissions!: Permission[]

    @OneToMany(() => User, (user) => user.role)
    users?: User[]

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
