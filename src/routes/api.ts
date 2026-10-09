import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"
import crypto from "crypto"

// ── Validators ──────────────────────────────────────────────────────────────
import { RegisterValidator, LoginValidator, ForgotPasswordValidator, ResetPasswordValidator, RefreshTokenValidator, GoogleLoginValidator, UpdateProfileValidator, UpdatePasswordValidator } from "../modules/auth/validators/auth.validator"
import { CreateUserValidator, UpdateUserValidator } from "../modules/user/validators/user.validator"
import { CreateCategoryValidator, UpdateCategoryValidator } from "../modules/content/validators/category.validator"
import { CreateArticleValidator, UpdateArticleValidator, RecordViewValidator } from "../modules/content/validators/article.validator"
import { CreateFaqValidator, UpdateFaqValidator } from "../modules/faq/validators/faq.validator"

// ── Middlewares ──────────────────────────────────────────────────────────────
import { authMiddleware } from "../core/middlewares/auth.middleware"
import { validationHook } from "../core/helpers/validator"
import { BadRequestException } from "../core/exceptions/base"

// ── Modules (controllers wired with their dependencies) ──────────────────────
import { authController } from "../modules/auth/auth.module"
import { userController } from "../modules/user/user.module"
import { categoryController, articleController } from "../modules/content/content.module"
import { faqController } from "../modules/faq/faq.module"

// ── Routes ───────────────────────────────────────────────────────────────────
const routes = new Hono()


// Auth
routes.post("/auth/register", zValidator("json", RegisterValidator, validationHook), (c) => authController.register(c))
routes.post("/auth/login", zValidator("json", LoginValidator, validationHook), (c) => authController.login(c))
routes.post("/auth/google", zValidator("json", GoogleLoginValidator, validationHook), (c) => authController.google(c))
routes.post("/auth/forgot-password", zValidator("json", ForgotPasswordValidator, validationHook), (c) => authController.forgotPassword(c))
routes.get("/auth/validate-reset-token", (c) => authController.validateResetToken(c))
routes.post("/auth/reset-password", zValidator("json", ResetPasswordValidator, validationHook), (c) => authController.resetPassword(c))
routes.post("/auth/refresh", zValidator("json", RefreshTokenValidator, validationHook), (c) => authController.refreshToken(c))
routes.get("/auth/me", authMiddleware, (c) => authController.me(c))
routes.put("/auth/profile", authMiddleware, zValidator("json", UpdateProfileValidator, validationHook), (c) => authController.updateProfile(c))
routes.put("/auth/password", authMiddleware, zValidator("json", UpdatePasswordValidator, validationHook), (c) => authController.updatePassword(c))
routes.post("/auth/logout", authMiddleware, (c) => authController.logout(c))

// User
routes.get("/user", authMiddleware, (c) => userController.index(c))
routes.get("/user/list", authMiddleware, (c) => userController.list(c))
routes.get("/user/:id", authMiddleware, (c) => userController.show(c))
routes.post("/user", authMiddleware, zValidator("json", CreateUserValidator, validationHook), (c) => userController.store(c))
routes.put("/user/:id", authMiddleware, zValidator("json", UpdateUserValidator, validationHook), (c) => userController.update(c))
routes.delete("/user/:id", authMiddleware, (c) => userController.destroy(c))

// Content - Categories
routes.get("/content/categories", authMiddleware, (c) => categoryController.index(c))
routes.get("/content/categories/all", authMiddleware, (c) => categoryController.list(c))
routes.get("/content/categories/:id", authMiddleware, (c) => categoryController.show(c))
routes.post("/content/categories", authMiddleware, zValidator("json", CreateCategoryValidator, validationHook), (c) => categoryController.store(c))
routes.put("/content/categories/:id", authMiddleware, zValidator("json", UpdateCategoryValidator, validationHook), (c) => categoryController.update(c))
routes.delete("/content/categories/:id", authMiddleware, (c) => categoryController.destroy(c))

// Content - Articles
routes.get("/content/articles", authMiddleware, (c) => articleController.index(c))
routes.get("/content/articles/:id", authMiddleware, (c) => articleController.show(c))
routes.get("/content/articles/slug/:slug", (c) => articleController.showBySlug(c))
routes.post("/content/articles", authMiddleware, zValidator("json", CreateArticleValidator, validationHook), (c) => articleController.store(c))
routes.put("/content/articles/:id", authMiddleware, zValidator("json", UpdateArticleValidator, validationHook), (c) => articleController.update(c))
routes.delete("/content/articles/:id", authMiddleware, (c) => articleController.destroy(c))
routes.post("/content/articles/:id/view", (c) => articleController.recordView(c))
routes.get("/content/articles/:id/views", authMiddleware, (c) => articleController.views(c))

// FAQ
routes.get("/faq", authMiddleware, (c) => faqController.index(c))
routes.get("/faq/:id", authMiddleware, (c) => faqController.show(c))
routes.post("/faq", authMiddleware, zValidator("json", CreateFaqValidator, validationHook), (c) => faqController.store(c))
routes.put("/faq/:id", authMiddleware, zValidator("json", UpdateFaqValidator, validationHook), (c) => faqController.update(c))
routes.delete("/faq/:id", authMiddleware, (c) => faqController.destroy(c))

// Upload
routes.post("/upload", authMiddleware, async (c) => {
    const body = await c.req.parseBody()
    const file = body["file"]

    if (!file || !(file instanceof File)) {
        throw new BadRequestException("No file uploaded or invalid file")
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const extension = file.name.split(".").pop() || "jpg"
    const objectName = `users/${crypto.randomUUID()}.${extension}`

    const { minio } = await import("../core/helpers/minio")
    await minio.upload(objectName, buffer, file.type)

    const { ApiResponse } = await import("../core/helpers/response")
    return ApiResponse.success(c, { path: objectName }, "File uploaded successfully")
})

// Proxy MinIO
routes.get("/proxy", async (c) => {
    const path = c.req.query("path")
    if (!path) return c.json({ message: "Missing 'path' query parameter" }, 400)

    const { minio } = await import("../core/helpers/minio")
    return minio.proxyHandler(path)
})

export default routes
