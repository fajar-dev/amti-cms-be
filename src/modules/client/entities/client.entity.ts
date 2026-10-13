import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from "typeorm"

@Entity("clients")
export class Client {
    @PrimaryGeneratedColumn()
    id!: number

    @Column({ length: 255 })
    name!: string

    @Column({ length: 500 })
    logo!: string

    @Column({ length: 500, nullable: true })
    website?: string | null

    @Column({ type: "int", default: 0 })
    order!: number

    @Column({ name: "is_active", default: true })
    isActive!: boolean

    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
