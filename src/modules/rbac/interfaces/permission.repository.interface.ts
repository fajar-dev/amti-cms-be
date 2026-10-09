import { Permission } from "../entities/permission.entity"

export interface IPermissionRepository {
    findAll(): Promise<Permission[]>
    findByIds(ids: number[]): Promise<Permission[]>
    findGroupedByModule(): Promise<Record<string, Permission[]>>
}
