import { Role } from "../entities/role.entity"
import { PermissionSerializer } from "./permission.serialize"

export class RoleSerializer {
    static single(role: Role) {
        return {
            id: role.id,
            name: role.name,
            displayName: role.displayName,
            description: role.description ?? null,
            isSystem: Boolean(role.isSystem),
            permissions: role.permissions ? PermissionSerializer.collection(role.permissions) : [],
            permissionCount: role.permissions ? role.permissions.length : 0,
            userCount: (role as any).userCount !== undefined ? Number((role as any).userCount) : (role.users ? role.users.length : 0),
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        }
    }

    static collection(roles: Role[]) {
        return roles.map(r => this.single(r))
    }
}
