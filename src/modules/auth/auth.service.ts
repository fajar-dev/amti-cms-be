import crypto from "crypto"
import { verify } from "hono/jwt"
import { config } from "../../config/config"
import { UnauthorizedException, BadRequestException } from "../../core/exceptions/base"
import { AuthHelper } from "../../core/helpers/auth"
import { hashPassword, comparePassword } from "../../core/helpers/hash"
import { logger } from "../../core/helpers/logger"
import { mail } from "../../core/helpers/mail"
import { minio } from "../../core/helpers/minio"
import { renderForgotPasswordEmail } from "../../core/templates/email"
import { User } from "../user/entities/user.entity"
import { UserService } from "../user/user.service"
import { IPasswordResetTokenRepository } from "./interfaces/password-reset-token.repository.interface"
import {
    RegisterValidator,
    LoginValidator,
    ForgotPasswordValidator,
    ResetPasswordValidator,
    RefreshTokenValidator,
    GoogleLoginValidator,
} from "./validators/auth.validator"

export class AuthService {
    constructor(
        private readonly userService: UserService,
        private readonly passwordResetTokenRepository: IPasswordResetTokenRepository,
    ) {}

    async register(data: RegisterValidator) {
        if (data.email) {
            const existing = await this.userService.getByEmail(data.email)
            if (existing) {
                throw new BadRequestException("Email already in use")
            }
        }

        // Transaction dikelola di repository layer (bukan service)
        return await this.userService.saveInTransaction({
            ...data,
            password: await hashPassword(data.password),
        })
    }

    async googleLogin(data: GoogleLoginValidator) {
        const payload = await AuthHelper.verifyGoogleCode(data.code)
        let user = await this.userService.getByEmailWithPassword(payload.email!)

        if (!user) {
            throw new BadRequestException("User not registered")
        }

        if (!user.isActive) {
            throw new BadRequestException("Account is inactive")
        }

        const { accessToken, refreshToken } = await AuthHelper.generateTokens(user)
        // Biarkan controller+serializer yang strip sensitive data
        return { user, accessToken, refreshToken }
    }

    async login(data: LoginValidator) {
        const user = await this.userService.getByEmailWithPassword(data.email)
        if (!user) {
            throw new UnauthorizedException("User not registered")
        }

        if (!user.isActive) {
            throw new UnauthorizedException("Account is inactive")
        }

        if (!user.password) {
            throw new UnauthorizedException("Invalid credentials")
        }

        const isValid = await comparePassword(data.password, user.password)
        if (!isValid) {
            throw new UnauthorizedException("Invalid credentials")
        }

        const { accessToken, refreshToken } = await AuthHelper.generateTokens(user)
        // Biarkan controller+serializer yang strip sensitive data
        return { user, accessToken, refreshToken }
    }

    async refreshToken(data: RefreshTokenValidator) {
        try {
            const decoded = await verify(data.refreshToken, config.app.jwtRefreshSecret, "HS256") as { sub: number }
            const user = await this.userService.getByIdWithPassword(decoded.sub)
            const { accessToken, refreshToken } = await AuthHelper.generateTokens(user)

            return { user, accessToken, refreshToken }
        } catch {
            throw new UnauthorizedException("Invalid or expired refresh token")
        }
    }

    async forgotPassword(data: ForgotPasswordValidator) {
        const user = await this.userService.getByEmail(data.email)
        if (!user) {
            throw new BadRequestException("Email not found")
        }

        if (!user.isActive) {
            throw new BadRequestException("Account is inactive")
        }

        const resetToken = crypto.randomBytes(32).toString("hex")
        const expiresAt = new Date(Date.now() + 36000000) // 10 hours

        await this.passwordResetTokenRepository.createToken(user.email, resetToken, expiresAt)

        const resetLink = `${config.app.appUrl}/auth/reset-password?email=${user.email}&token=${resetToken}`
        const { html, text } = renderForgotPasswordEmail({
            name: user.name,
            resetLink,
            expiresInHours: 10,
        })
        mail.sendHtml(user.email, "Reset Password", html, text).catch(err => logger.error('Failed to send forgot-password email', { email: user.email, err }))
    }

    async resetPassword(data: ResetPasswordValidator) {
        const tokenRecord = await this.passwordResetTokenRepository.findValidByToken(data.token)
        if (!tokenRecord) {
            throw new BadRequestException("Invalid or expired reset token")
        }

        const user = await this.userService.getByEmailWithPassword(tokenRecord.email)
        if (!user) {
            throw new BadRequestException("User not found")
        }

        user.password = await hashPassword(data.newPassword)
        await this.userService.save(user)

        // Hapus semua token reset password untuk email ini setelah berhasil di-reset
        await this.passwordResetTokenRepository.deleteByEmail(tokenRecord.email)
    }

    async validateResetToken(email?: string, token?: string) {
        if (!token) {
            throw new BadRequestException("Reset token is required")
        }
        if (!email) {
            throw new BadRequestException("Email is required")
        }

        const tokenRecord = await this.passwordResetTokenRepository.findValidByEmailAndToken(email, token)
        if (!tokenRecord) {
            throw new BadRequestException("Invalid or expired reset token")
        }
    }

    /**
     * Logout bersifat stateless: access token tetap valid sampai kedaluwarsa
     * (15 menit) karena belum ada mekanisme revokasi token di server.
     */
    async logout(_user: User): Promise<void> {}

    async updateProfile(userId: number, data: { name: string; email: string; photo?: string | null }) {
        const user = await this.userService.getByIdWithPassword(userId)

        if (data.email && data.email !== user.email) {
            const existing = await this.userService.getByEmail(data.email)
            if (existing) {
                throw new BadRequestException("Email already in use")
            }
        }

        user.name = data.name
        user.email = data.email
        if (data.photo !== undefined) {
            user.photo = minio.sanitizePath(data.photo) ?? undefined
        }

        return await this.userService.save(user)
    }

    async updatePassword(userId: number, data: { oldPassword?: string; newPassword: string }) {
        const user = await this.userService.getByIdWithPassword(userId)

        if (user.password) {
            if (!data.oldPassword) {
                throw new BadRequestException("Old password is required")
            }
            const isValid = await comparePassword(data.oldPassword, user.password)
            if (!isValid) {
                throw new BadRequestException("Invalid old password")
            }
        }

        user.password = await hashPassword(data.newPassword)
        await this.userService.save(user)
    }
}
