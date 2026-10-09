import { Role } from "../entities/role.entity"
import { SortOrder } from "../../../core/interfaces/base.repository.interface"

export interface IRoleRepository {
    findAll(page: number, limit: number, q?: string, sortBy?: string, order?: SortOrder): Promise<{ data: any[]; total: number }>
    findAllList(): Promise<Role[]>
    findById(id: number): Promise<Role | null>
    findByName(name: string): Promise<Role | null>
    save(role: Partial<Role>): Promise<Role>
    delete(id: number): Promise<boolean>
    countUsersByRoleId(roleId: number): Promise<number>
}
