import { Context, Next } from 'hono'
import { User } from '../../modules/user/entities/user.entity'
import { ForbiddenException, UnauthorizedException } from '../exceptions/base'

export const requirePermission = (...permissions: string[]) => {
    return async (c: Context, next: Next) => {
        const user = c.get('user') as User | undefined
        if (!user) {
            throw new UnauthorizedException("Unauthorized access")
        }

        // Super admin bypasses all permission checks
        if (user.role?.name === 'super_admin') {
            return await next()
        }

        // Any user without a role has zero permissions
        if (!user.role) {
            throw new ForbiddenException("You do not have permission to perform this action")
        }

        const userPerms = user.role.permissions || []
        const hasPerm = permissions.some(required => userPerms.some(p => p.name === required))
        if (!hasPerm) {
            throw new ForbiddenException("You do not have permission to perform this action")
        }

        await next()
    }
}

export const requireRole = (...roles: string[]) => {
    return async (c: Context, next: Next) => {
        const user = c.get('user') as User | undefined
        if (!user) {
            throw new UnauthorizedException("Unauthorized access")
        }

        if (user.role?.name === 'super_admin') {
            return await next()
        }

        if (!user.role || !roles.includes(user.role.name)) {
            throw new ForbiddenException("You do not have permission to perform this action")
        }

        await next()
    }
}
