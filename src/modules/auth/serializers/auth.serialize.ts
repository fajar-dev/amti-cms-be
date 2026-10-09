import { User } from "../../user/entities/user.entity"
import { minio } from "../../../core/helpers/minio"

export class AuthSerializer {
    private static async resolvePhotoUrl(photo?: string | null): Promise<string | null> {
        if (!photo) return null
        return await minio.getPresignedUrl(photo)
    }

    static async single(user: User) {
        return {
            id: user.id,
            name: user.name,
            photo: await this.resolvePhotoUrl(user.photo),
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
