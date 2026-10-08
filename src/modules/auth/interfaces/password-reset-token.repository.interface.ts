import { PasswordResetToken } from "../entities/password-reset-token.entity"
import { IBaseRepository } from "../../../core/interfaces/base.repository.interface"

export interface IPasswordResetTokenRepository extends IBaseRepository<PasswordResetToken> {
    createToken(email: string, token: string, expiresAt: Date): Promise<PasswordResetToken>
    findValidByToken(token: string): Promise<PasswordResetToken | null>
    findValidByEmailAndToken(email: string, token: string): Promise<PasswordResetToken | null>
    deleteByEmail(email: string): Promise<void>
    deleteExpired(): Promise<void>
}
