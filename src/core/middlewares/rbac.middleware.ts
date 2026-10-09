import { Context, Next } from 'hono'
import { User } from '../../modules/user/entities/user.entity'
import { ForbiddenException, UnauthorizedException } from '../exceptions/base'

export const requirePermission = (...permissions: string[]) => {
    return async (c: Context, next: Next) => {
        const user = c.get('user') as User | undefined
        if (!user) {
            throw new UnauthorizedException("Unauthorized access")
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

export const requireRole = (...roles: (number | string)[]) => {
    return async (c: Context, next: Next) => {
        const user = c.get('user') as User | undefined
        if (!user) {
            throw new UnauthorizedException("Unauthorized access")
        }

        const matches = user.role && roles.some(r => r === user.role!.id || r === user.role!.name)
        if (!matches) {
            throw new ForbiddenException("You do not have permission to perform this action")
        }

        await next()
    }
}
