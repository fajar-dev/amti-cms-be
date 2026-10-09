import { Context } from "hono"
import { RbacService } from "./rbac.service"
import { RoleSerializer } from "./serializers/role.serialize"
import { PermissionSerializer } from "./serializers/permission.serialize"
import { ApiResponse } from "../../core/helpers/response"

export class RbacController {
    constructor(private readonly service: RbacService) {}

    async index(c: Context) {
        const page = Number(c.req.query("page") || 1)
        const limit = Number(c.req.query("limit") || 10)
        const q = c.req.query("q") || undefined
        const sortBy = c.req.query("sortBy") || undefined
        const order = c.req.query("order")?.toUpperCase() === "DESC" ? "DESC" : "ASC"

        const { data, total } = await this.service.getRoles(page, limit, q, sortBy, order)
        return ApiResponse.paginate(c, RoleSerializer.collection(data), total, page, limit, "Roles retrieved successfully")
    }

    async list(c: Context) {
        const roles = await this.service.getAllRolesList()
        return ApiResponse.success(c, roles.map(r => ({
            id: r.id,
            name: r.name,
            displayName: r.displayName,
            isSystem: Boolean(r.isSystem),
        })), "Roles list retrieved successfully")
    }

    async show(c: Context) {
        const id = Number(c.req.param("id"))
        const role = await this.service.getRoleById(id)
        return ApiResponse.success(c, RoleSerializer.single(role), "Role retrieved successfully")
    }

    async store(c: Context) {
        const data = c.req.valid("json" as never)
        const role = await this.service.createRole(data)
        return ApiResponse.success(c, RoleSerializer.single(role), "Role created successfully", 201)
    }

    async update(c: Context) {
        const id = Number(c.req.param("id"))
        const data = c.req.valid("json" as never)
        const role = await this.service.updateRole(id, data)
        return ApiResponse.success(c, RoleSerializer.single(role), "Role updated successfully")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.deleteRole(id)
        return ApiResponse.success(c, null, "Role deleted successfully")
    }

    async permissions(c: Context) {
        const { flat, grouped } = await this.service.getPermissions()
        const serializedGrouped: Record<string, any[]> = {}
        for (const [moduleName, perms] of Object.entries(grouped)) {
            serializedGrouped[moduleName] = PermissionSerializer.collection(perms)
        }
        return ApiResponse.success(c, {
            flat: PermissionSerializer.collection(flat),
            grouped: serializedGrouped,
        }, "Permissions retrieved successfully")
    }
}
