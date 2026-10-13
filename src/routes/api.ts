import { Hono } from "hono"
import { zValidator } from "@hono/zod-validator"

// ── Validators ──────────────────────────────────────────────────────────────
import { RegisterValidator, LoginValidator, ForgotPasswordValidator, ResetPasswordValidator, RefreshTokenValidator, GoogleLoginValidator, UpdateProfileValidator, UpdatePasswordValidator } from "../modules/auth/validators/auth.validator"
import { CreateUserValidator, UpdateUserValidator } from "../modules/user/validators/user.validator"
import { CreateCategoryValidator, UpdateCategoryValidator } from "../modules/content/validators/category.validator"
import { CreateArticleValidator, UpdateArticleValidator, RecordViewValidator } from "../modules/content/validators/article.validator"
import { CreateFaqValidator, UpdateFaqValidator } from "../modules/faq/validators/faq.validator"
import { CreateClientValidator, UpdateClientValidator } from "../modules/client/validators/client.validator"
import { CreateRoleValidator, UpdateRoleValidator } from "../modules/rbac/validators/role.validator"
import { UpdateSettingValidator, UpdateSettingMetaValidator, UpdateSettingContactValidator, UpdateSettingSocialValidator } from "../modules/setting/validators/setting.validator"
import { CreateMessageValidator, UpdateMessageStatusValidator } from "../modules/message/validators/message.validator"

// ── Middlewares ──────────────────────────────────────────────────────────────
import { authMiddleware } from "../core/middlewares/auth.middleware"
import { requirePermission } from "../core/middlewares/rbac.middleware"
import { optionalJsonBody } from "../core/middlewares/optional-json.middleware"
import { validationHook } from "../core/helpers/validator"

// ── Modules (controllers wired with their dependencies) ──────────────────────
import { authController } from "../modules/auth/auth.module"
import { userController } from "../modules/user/user.module"
import { categoryController, articleController } from "../modules/content/content.module"
import { faqController } from "../modules/faq/faq.module"
import { clientController } from "../modules/client/client.module"
import { rbacController } from "../modules/rbac/rbac.module"
import { settingController } from "../modules/setting/setting.module"
import { messageController } from "../modules/message/message.module"
import { dashboardController } from "../modules/dashboard/dashboard.module"
import { storageController } from "../modules/storage/storage.module"

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
routes.get("/user", authMiddleware, requirePermission("users.view"), (c) => userController.index(c))
routes.get("/user/list", authMiddleware, requirePermission("users.view", "articles.create", "articles.update"), (c) => userController.list(c))
routes.get("/user/:id", authMiddleware, requirePermission("users.view"), (c) => userController.show(c))
routes.post("/user", authMiddleware, requirePermission("users.create"), zValidator("json", CreateUserValidator, validationHook), (c) => userController.store(c))
routes.put("/user/:id", authMiddleware, requirePermission("users.update"), zValidator("json", UpdateUserValidator, validationHook), (c) => userController.update(c))
routes.delete("/user/:id", authMiddleware, requirePermission("users.delete"), (c) => userController.destroy(c))

// Content - Categories
routes.get("/content/categories", authMiddleware, requirePermission("categories.view"), (c) => categoryController.index(c))
routes.get("/content/categories/all", authMiddleware, requirePermission("categories.view", "articles.create", "articles.update"), (c) => categoryController.list(c))
routes.get("/content/categories/:id", authMiddleware, requirePermission("categories.view"), (c) => categoryController.show(c))
routes.post("/content/categories", authMiddleware, requirePermission("categories.create"), zValidator("json", CreateCategoryValidator, validationHook), (c) => categoryController.store(c))
routes.put("/content/categories/:id", authMiddleware, requirePermission("categories.update"), zValidator("json", UpdateCategoryValidator, validationHook), (c) => categoryController.update(c))
routes.delete("/content/categories/:id", authMiddleware, requirePermission("categories.delete"), (c) => categoryController.destroy(c))

// Public Website (tanpa autentikasi) — hanya artikel berstatus publish
routes.get("/articles", (c) => articleController.publicIndex(c))

// Content - Articles
routes.get("/content/articles", authMiddleware, requirePermission("articles.view"), (c) => articleController.index(c))
routes.get("/content/articles/:id", authMiddleware, requirePermission("articles.view"), (c) => articleController.show(c))
routes.get("/content/articles/slug/:slug", (c) => articleController.showBySlug(c))
routes.post("/content/articles", authMiddleware, requirePermission("articles.create"), zValidator("json", CreateArticleValidator, validationHook), (c) => articleController.store(c))
routes.put("/content/articles/:id", authMiddleware, requirePermission("articles.update"), zValidator("json", UpdateArticleValidator, validationHook), (c) => articleController.update(c))
routes.delete("/content/articles/:id", authMiddleware, requirePermission("articles.delete"), (c) => articleController.destroy(c))
routes.post("/content/articles/:id/view", optionalJsonBody(RecordViewValidator), (c) => articleController.recordView(c))
routes.get("/content/articles/:id/views", authMiddleware, requirePermission("articles.view"), (c) => articleController.views(c))

// FAQ
routes.get("/faqs", (c) => faqController.publicIndex(c))
routes.get("/faq/public", (c) => faqController.publicIndex(c))
routes.get("/faq", authMiddleware, requirePermission("faqs.view"), (c) => faqController.index(c))
routes.get("/faq/:id", authMiddleware, requirePermission("faqs.view"), (c) => faqController.show(c))
routes.post("/faq", authMiddleware, requirePermission("faqs.create"), zValidator("json", CreateFaqValidator, validationHook), (c) => faqController.store(c))
routes.put("/faq/:id", authMiddleware, requirePermission("faqs.update"), zValidator("json", UpdateFaqValidator, validationHook), (c) => faqController.update(c))
routes.delete("/faq/:id", authMiddleware, requirePermission("faqs.delete"), (c) => faqController.destroy(c))

// Clients
routes.get("/clients", (c) => clientController.publicIndex(c))
routes.get("/clients/public", (c) => clientController.publicIndex(c))
routes.get("/client", authMiddleware, requirePermission("clients.view"), (c) => clientController.index(c))
routes.get("/client/:id", authMiddleware, requirePermission("clients.view"), (c) => clientController.show(c))
routes.post("/client", authMiddleware, requirePermission("clients.create"), zValidator("json", CreateClientValidator, validationHook), (c) => clientController.store(c))
routes.put("/client/:id", authMiddleware, requirePermission("clients.update"), zValidator("json", UpdateClientValidator, validationHook), (c) => clientController.update(c))
routes.delete("/client/:id", authMiddleware, requirePermission("clients.delete"), (c) => clientController.destroy(c))

// RBAC
routes.get("/rbac/roles", authMiddleware, requirePermission("roles.view"), (c) => rbacController.index(c))
routes.get("/rbac/roles/all", authMiddleware, requirePermission("roles.view", "users.create", "users.update"), (c) => rbacController.list(c))
routes.get("/rbac/roles/:id", authMiddleware, requirePermission("roles.view"), (c) => rbacController.show(c))
routes.post("/rbac/roles", authMiddleware, requirePermission("roles.create"), zValidator("json", CreateRoleValidator, validationHook), (c) => rbacController.store(c))
routes.put("/rbac/roles/:id", authMiddleware, requirePermission("roles.update"), zValidator("json", UpdateRoleValidator, validationHook), (c) => rbacController.update(c))
routes.delete("/rbac/roles/:id", authMiddleware, requirePermission("roles.delete"), (c) => rbacController.destroy(c))
routes.get("/rbac/permissions", authMiddleware, requirePermission("roles.view", "roles.create", "roles.update"), (c) => rbacController.permissions(c))

// Settings
routes.get("/settings/public", (c) => settingController.getPublic(c))
routes.get("/settings", authMiddleware, requirePermission("settings.view", "settings.meta.view", "settings.contact.view", "settings.social.view"), (c) => settingController.show(c))
routes.put("/settings", authMiddleware, requirePermission("settings.update"), zValidator("json", UpdateSettingValidator, validationHook), (c) => settingController.update(c))
routes.put("/settings/meta", authMiddleware, requirePermission("settings.meta.update", "settings.update"), zValidator("json", UpdateSettingMetaValidator, validationHook), (c) => settingController.updateMeta(c))
routes.put("/settings/contact", authMiddleware, requirePermission("settings.contact.update", "settings.update"), zValidator("json", UpdateSettingContactValidator, validationHook), (c) => settingController.updateContact(c))
routes.put("/settings/social", authMiddleware, requirePermission("settings.social.update", "settings.update"), zValidator("json", UpdateSettingSocialValidator, validationHook), (c) => settingController.updateSocial(c))

// Messages
routes.post("/messages", zValidator("json", CreateMessageValidator, validationHook), (c) => messageController.store(c))
routes.get("/messages", authMiddleware, requirePermission("messages.view"), (c) => messageController.index(c))
routes.get("/messages/:id", authMiddleware, requirePermission("messages.view"), (c) => messageController.show(c))
routes.put("/messages/:id/read", authMiddleware, requirePermission("messages.update"), zValidator("json", UpdateMessageStatusValidator, validationHook), (c) => messageController.updateStatus(c))
routes.patch("/messages/:id/read", authMiddleware, requirePermission("messages.update"), zValidator("json", UpdateMessageStatusValidator, validationHook), (c) => messageController.updateStatus(c))
routes.delete("/messages/:id", authMiddleware, requirePermission("messages.delete"), (c) => messageController.destroy(c))

// Dashboard
routes.get("/dashboard/summary", authMiddleware, (c) => dashboardController.getSummary(c))
routes.get("/dashboard/views-trend", authMiddleware, (c) => dashboardController.getViewsTrend(c))
routes.get("/dashboard/categories-distribution", authMiddleware, (c) => dashboardController.getCategoriesDistribution(c))
routes.get("/dashboard/messages-trend", authMiddleware, (c) => dashboardController.getMessagesTrend(c))
routes.get("/dashboard/recent-articles", authMiddleware, (c) => dashboardController.getRecentArticles(c))
routes.get("/dashboard/recent-messages", authMiddleware, (c) => dashboardController.getRecentMessages(c))

// Storage
routes.post("/upload", authMiddleware, (c) => storageController.upload(c))
routes.get("/proxy", (c) => storageController.proxy(c))

export default routes
