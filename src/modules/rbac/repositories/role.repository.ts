import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Role } from "../entities/role.entity"
import { IRoleRepository } from "../interfaces/role.repository.interface"
import { SortOrder } from "../../../core/interfaces/base.repository.interface"

const SORTABLE_COLUMNS: Record<string, string> = {
    name: "role.name",
    displayName: "role.displayName",
    isSystem: "role.isSystem",
    createdAt: "role.createdAt",
}

export class TypeOrmRoleRepository implements IRoleRepository {
    private readonly repository: Repository<Role>

    constructor() {
        this.repository = AppDataSource.getRepository(Role)
    }

    async findAll(page: number, limit: number, q?: string, sortBy?: string, order: SortOrder = "ASC"): Promise<{ data: any[]; total: number }> {
        const offset = (page - 1) * limit

        const query = this.repository.createQueryBuilder("role")
            .leftJoinAndSelect("role.permissions", "permission")
            .loadRelationCountAndMap("role.userCount", "role.users")

        if (q) {
            query.where(
                "(role.name LIKE :q OR role.displayName LIKE :q OR role.description LIKE :q)",
                { q: `%${q}%` }
            )
        }

        const total = await query.getCount()

        const orderColumn = (sortBy && SORTABLE_COLUMNS[sortBy]) || "role.id"
        query.orderBy(orderColumn, order)
            .limit(limit)
            .offset(offset)

        const data = await query.getMany()

        return { data, total }
    }

    async findAllList(): Promise<Role[]> {
        return await this.repository.find({
            select: ["id", "name", "displayName", "isSystem"],
            order: { displayName: "ASC" }
        })
    }

    async findById(id: number): Promise<Role | null> {
        return await this.repository.findOne({
            where: { id },
            relations: ["permissions"],
        })
    }

    async findByName(name: string): Promise<Role | null> {
        return await this.repository.findOne({
            where: { name },
            relations: ["permissions"],
        })
    }

    async save(role: Partial<Role>): Promise<Role> {
        return await this.repository.save(role as Role)
    }

    async delete(id: number): Promise<boolean> {
        const result = await this.repository.delete(id)
        return (result.affected ?? 0) > 0
    }

    async countUsersByRoleId(roleId: number): Promise<number> {
        const userRepo = AppDataSource.getRepository("User")
        return await userRepo.count({ where: { roleId } })
    }
}
