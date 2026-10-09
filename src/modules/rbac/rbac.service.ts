import { IRoleRepository } from "./interfaces/role.repository.interface"
import { IPermissionRepository } from "./interfaces/permission.repository.interface"
import { Role } from "./entities/role.entity"
import { Permission } from "./entities/permission.entity"
import { BadRequestException, NotFoundException } from "../../core/exceptions/base"
import { SortOrder } from "../../core/interfaces/base.repository.interface"

export class RbacService {
    constructor(
        private readonly roleRepository: IRoleRepository,
        private readonly permissionRepository: IPermissionRepository
    ) {}

    async getRoles(page: number, limit: number, q?: string, sortBy?: string, order?: SortOrder) {
        return await this.roleRepository.findAll(page, limit, q, sortBy, order)
    }

    async getAllRolesList(): Promise<Role[]> {
        return await this.roleRepository.findAllList()
    }

    async getRoleById(id: number): Promise<Role> {
        const role = await this.roleRepository.findById(id)
        if (!role) {
            throw new NotFoundException("Role not found")
        }
        return role
    }

    async createRole(data: { name: string; description?: string | null; permissionIds?: number[] }): Promise<Role> {
        const existing = await this.roleRepository.findByName(data.name.trim())
        if (existing) {
            throw new BadRequestException("Role name already exists")
        }

        let permissions: Permission[] = []
        if (data.permissionIds && data.permissionIds.length > 0) {
            permissions = await this.permissionRepository.findByIds(data.permissionIds)
        }

        const role = new Role()
        role.name = data.name.trim()
        role.description = data.description ? data.description.trim() : undefined
        role.permissions = permissions

        return await this.roleRepository.save(role)
    }

    async updateRole(id: number, data: { name?: string; description?: string | null; permissionIds?: number[] }): Promise<Role> {
        const role = await this.getRoleById(id)

        if (data.name && data.name.trim() !== role.name) {
            const existing = await this.roleRepository.findByName(data.name.trim())
            if (existing && existing.id !== id) {
                throw new BadRequestException("Role name already in use")
            }
            role.name = data.name.trim()
        }

        if (data.description !== undefined) {
            role.description = data.description ? data.description.trim() : undefined
        }

        if (data.permissionIds !== undefined) {
            if (data.permissionIds.length > 0) {
                role.permissions = await this.permissionRepository.findByIds(data.permissionIds)
            } else {
                role.permissions = []
            }
        }

        return await this.roleRepository.save(role)
    }

    async deleteRole(id: number): Promise<void> {
        await this.getRoleById(id)

        const userCount = await this.roleRepository.countUsersByRoleId(id)
        if (userCount > 0) {
            throw new BadRequestException(`Cannot delete role currently assigned to ${userCount} user(s)`)
        }

        await this.roleRepository.delete(id)
    }

    async getPermissions(): Promise<{ flat: Permission[]; grouped: Record<string, Permission[]> }> {
        const flat = await this.permissionRepository.findAll()
        const grouped = await this.permissionRepository.findGroupedByModule()
        return { flat, grouped }
    }
}
