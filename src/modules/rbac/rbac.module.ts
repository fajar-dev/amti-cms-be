import { TypeOrmRoleRepository } from "./repositories/role.repository"
import { TypeOrmPermissionRepository } from "./repositories/permission.repository"
import { RbacService } from "./rbac.service"
import { RbacController } from "./rbac.controller"

const roleRepository = new TypeOrmRoleRepository()
const permissionRepository = new TypeOrmPermissionRepository()

export const rbacService = new RbacService(roleRepository, permissionRepository)
export const rbacController = new RbacController(rbacService)
