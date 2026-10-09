import { EntityManager, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { User } from "../entities/user.entity"
import { IUserRepository, UserListFilters } from "../interfaces/user.repository.interface"
import { SortOrder } from "../../../core/interfaces/base.repository.interface"

const SORTABLE_COLUMNS: Record<string, string> = {
    name: "user.name",
    email: "user.email",
    isActive: "user.isActive",
    createdAt: "user.createdAt",
    role: "role.name",
}

export class TypeOrmUserRepository implements IUserRepository {
    private readonly repository: Repository<User>

    constructor() {
        this.repository = AppDataSource.getRepository(User)
    }

    async findAll(page: number, limit: number, q: string, filters: UserListFilters = {}, sortBy?: string, order: SortOrder = "DESC"): Promise<{ data: any[]; total: number }> {
        const offset = (page - 1) * limit

        const query = this.repository.createQueryBuilder("user")
            .leftJoinAndSelect("user.role", "role")

        if (q) {
            query.where(
                "(user.name LIKE :q OR user.email LIKE :q)",
                { q: `%${q}%` }
            )
        }

        if (filters.isActive !== undefined && filters.isActive !== "") {
            query.andWhere("user.isActive = :isActive", { isActive: filters.isActive === "1" || filters.isActive === "true" })
        }

        const total = await query.getCount()

        const orderColumn = (sortBy && SORTABLE_COLUMNS[sortBy]) || "user.id"

        const data = await query
            .orderBy(orderColumn, order)
            .limit(limit)
            .offset(offset)
            .getMany()

        return { data, total }
    }

    async findAllList(isActiveOnly = true): Promise<any[]> {
        const query = this.repository.createQueryBuilder("user")
            .select([
                "user.id AS id",
                "user.name AS name",
                "user.photo AS photo",
                "user.email AS email",
                "user.is_active AS isActive",
            ])
            .orderBy("user.name", "ASC")

        if (isActiveOnly) {
            query.where("user.is_active = :isActive", { isActive: true })
        }

        return await query.getRawMany()
    }

    async findById(id: number): Promise<User | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ["role"]
        })
    }

    async findByEmail(email: string): Promise<User | null> {
        return await this.repository.findOne({
            where: { email },
            relations: ["role", "role.permissions"]
        })
    }

    async findByEmailWithPassword(email: string): Promise<User | null> {
        return await this.repository.createQueryBuilder("user")
            .leftJoinAndSelect("user.role", "role")
            .leftJoinAndSelect("role.permissions", "permission")
            .where("user.email = :email", { email })
            .addSelect("user.password")
            .getOne()
    }

    async findByIdWithPassword(id: number): Promise<User | null> {
        return await this.repository.createQueryBuilder("user")
            .where("user.id = :id", { id })
            .addSelect("user.password")
            .getOne()
    }

    async save(data: Partial<User>, manager?: EntityManager): Promise<User> {
        const repo = manager ? manager.getRepository(User) : this.repository
        return await repo.save(data)
    }

    merge(entity: User, data: Partial<User>): User {
        return this.repository.merge(entity, data)
    }

    async saveInTransaction(data: Partial<User>): Promise<User> {
        return AppDataSource.transaction(async (manager) => {
            return await manager.getRepository(User).save(data)
        })
    }

    async delete(id: number): Promise<void> {
        await this.repository.delete(id)
    }
}
