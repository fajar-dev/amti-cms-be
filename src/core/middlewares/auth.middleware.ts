import { Context, Next } from 'hono'
import { verify } from 'hono/jwt'
import { config } from '../../config/config'
import { AppDataSource } from '../../config/database'
import { User } from '../../modules/user/entities/user.entity'
import { UnauthorizedException } from '../exceptions/base'

export const authMiddleware = async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException("Missing or invalid authorization header")
    }

    const token = authHeader.split(' ')[1]
    let user: User | null = null

    try {
        const decoded = await verify(token, config.app.jwtSecret, "HS256") as { sub: number }
        const userRepository = AppDataSource.getRepository(User)
        user = await userRepository.findOne({
            where: { id: decoded.sub },
            relations: ["role", "role.permissions"],
            select: ["id", "name", "photo", "email", "password", "isActive", "createdAt", "updatedAt", "roleId"],
        })
    } catch {
        throw new UnauthorizedException("Invalid or expired token")
    }

    if (!user) {
        throw new UnauthorizedException("Unauthorized access")
    }

    if (!user.isActive) {
        throw new UnauthorizedException("User account is inactive")
    }

    c.set('user', user)
    await next()
}
