import { Permission } from "../entities/permission.entity"

export class PermissionSerializer {
    static single(permission: Permission) {
        return {
            id: permission.id,
            name: permission.name,
            module: permission.module,
            description: permission.description ?? null,
        }
    }

    static collection(permissions: Permission[]) {
        return permissions.map(p => this.single(p))
    }
}
