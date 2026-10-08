import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from "typeorm"
import { Article } from "./article.entity"

@Entity("article_views")
export class ArticleView {
    @PrimaryGeneratedColumn()
    id!: number

    @Index()
    @Column({ name: "article_id" })
    articleId!: number

    @ManyToOne(() => Article, (article) => article.views, { onDelete: "CASCADE" })
    @JoinColumn({ name: "article_id" })
    article!: Article

    @Column({ name: "ip_address", type: "varchar", length: 45, nullable: true })
    ipAddress?: string | null

    @Column({ name: "user_agent", type: "text", nullable: true })
    userAgent?: string | null

    @Column({ type: "varchar", length: 500, nullable: true })
    referrer?: string | null

    @Column({ name: "user_id", nullable: true })
    userId?: number | null

    @CreateDateColumn({ name: "viewed_at" })
    viewedAt!: Date
}
