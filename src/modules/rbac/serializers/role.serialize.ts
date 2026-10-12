import { Role } from "../entities/role.entity"
import { PermissionSerializer } from "./permission.serialize"
import { resolveStorageUrl } from "../../../core/helpers/storage-url"

export class RoleSerializer {
    static async single(role: Role) {
        const users = role.users
            ? await Promise.all(
                role.users.map(async (u) => ({
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    photo: await resolveStorageUrl(u.photo),
                }))
            )
            : []

        return {
            id: role.id,
            name: role.name,
            description: role.description ?? null,
            permissions: role.permissions ? PermissionSerializer.collection(role.permissions) : [],
            permissionCount: role.permissions ? role.permissions.length : 0,
            userCount: role.users ? role.users.length : Number((role as any).userCount || 0),
            users,
            createdAt: role.createdAt,
            updatedAt: role.updatedAt,
        }
    }

    static async collection(roles: Role[]) {
        return Promise.all(roles.map(r => this.single(r)))
    }

    /** Bentuk ringkas untuk dropdown / pemilih peran. */
    static option(role: Role) {
        return {
            id: role.id,
            name: role.name,
        }
    }

    static options(roles: Role[]) {
        return roles.map(r => this.option(r))
    }
}
