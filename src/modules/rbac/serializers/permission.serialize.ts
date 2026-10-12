import { Permission } from "../entities/permission.entity"

export interface SerializedPermission {
    id: number
    name: string
    module: string
    description: string | null
}

export class PermissionSerializer {
    static single(permission: Permission): SerializedPermission {
        return {
            id: permission.id,
            name: permission.name,
            module: permission.module,
            description: permission.description ?? null,
        }
    }

    static collection(permissions: Permission[]): SerializedPermission[] {
        return permissions.map(p => this.single(p))
    }

    /** Serialisasi permission yang sudah dikelompokkan per modul. */
    static collectionByModule(grouped: Record<string, Permission[]>): Record<string, SerializedPermission[]> {
        return Object.fromEntries(
            Object.entries(grouped).map(([moduleName, permissions]) => [moduleName, this.collection(permissions)])
        )
    }
}
