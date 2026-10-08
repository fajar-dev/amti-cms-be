import { userService } from "../user/user.module"
import { TypeOrmPasswordResetTokenRepository } from "./repositories/password-reset-token.repository"
import { AuthService } from "./auth.service"
import { AuthController } from "./auth.controller"

export const passwordResetTokenRepository = new TypeOrmPasswordResetTokenRepository()
export const authService = new AuthService(userService, passwordResetTokenRepository)
export const authController = new AuthController(authService)
