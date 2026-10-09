import { In, Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Permission } from "../entities/permission.entity"
import { IPermissionRepository } from "../interfaces/permission.repository.interface"

export class TypeOrmPermissionRepository implements IPermissionRepository {
    private readonly repository: Repository<Permission>

    constructor() {
        this.repository = AppDataSource.getRepository(Permission)
    }

    async findAll(): Promise<Permission[]> {
        return await this.repository.find({
            order: { module: "ASC", name: "ASC" }
        })
    }

    async findByIds(ids: number[]): Promise<Permission[]> {
        if (!ids || ids.length === 0) return []
        return await this.repository.find({
            where: { id: In(ids) }
        })
    }

    async findGroupedByModule(): Promise<Record<string, Permission[]>> {
        const permissions = await this.findAll()
        const grouped: Record<string, Permission[]> = {}

        for (const perm of permissions) {
            if (!grouped[perm.module]) {
                grouped[perm.module] = []
            }
            grouped[perm.module].push(perm)
        }

        return grouped
    }
}
