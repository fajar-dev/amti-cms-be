import { User } from "../../user/entities/user.entity"
import { resolveStorageUrl } from "../../../core/helpers/storage-url"

export class AuthSerializer {
    static async single(user: User) {
        return {
            id: user.id,
            name: user.name,
            photo: await resolveStorageUrl(user.photo),
            email: user.email,
            isActive: Boolean(user.isActive),
            hasPassword: !!user.password,
            role: user.role ? {
                id: user.role.id,
                name: user.role.name,
                permissions: user.role.permissions ? user.role.permissions.map((p: any) => p.name) : [],
            } : null,
        }
    }

    static async collection(users: User[]) {
        return Promise.all(users.map(u => this.single(u)))
    }
}
