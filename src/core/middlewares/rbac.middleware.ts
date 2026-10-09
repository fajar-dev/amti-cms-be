import { Context, Next } from 'hono'
import { User } from '../../modules/user/entities/user.entity'
import { ForbiddenException, UnauthorizedException } from '../exceptions/base'

export const requirePermission = (permission: string) => {
    return async (c: Context, next: Next) => {
        const user = c.get('user') as User
        if (!user) {
            throw new UnauthorizedException("Unauthorized access")
        }

        // If user has no role assigned or is super_admin, permit access
        if (!user.role || user.role.name === 'super_admin') {
            return await next()
        }

        const hasPerm = user.role.permissions?.some(p => p.name === permission)
        if (!hasPerm) {
            throw new ForbiddenException("You do not have permission to perform this action")
        }

        await next()
    }
}

export const requireRole = (...roles: string[]) => {
    return async (c: Context, next: Next) => {
        const user = c.get('user') as User
        if (!user) {
            throw new UnauthorizedException("Unauthorized access")
        }

        if (!user.role || user.role.name === 'super_admin') {
            return await next()
        }

        if (!roles.includes(user.role.name)) {
            throw new ForbiddenException("You do not have permission to perform this action")
        }

        await next()
    }
}
