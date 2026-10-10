import "reflect-metadata"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { DataSource } from "typeorm"
import { User } from "../src/modules/user/entities/user.entity"
import { PasswordResetToken } from "../src/modules/auth/entities/password-reset-token.entity"
import { Category } from "../src/modules/content/entities/category.entity"
import { Article } from "../src/modules/content/entities/article.entity"
import { ArticleView } from "../src/modules/content/entities/article-view.entity"
import { Faq } from "../src/modules/faq/entities/faq.entity"
import { Role } from "../src/modules/rbac/entities/role.entity"
import { Permission } from "../src/modules/rbac/entities/permission.entity"
import { Setting } from "../src/modules/setting/entities/setting.entity"
import { Message } from "../src/modules/message/entities/message.entity"
import { ApiResponse } from "../src/core/helpers/response"
import { BaseException, ValidationException } from "../src/core/exceptions/base"
import { ZodError } from "zod"
import { config } from "../src/config/config"
import { setDataSource } from "../src/config/database"
import { languageMiddleware } from "../src/core/middlewares/language.middleware"
import { requestLogger } from "../src/core/middlewares/logger.middleware"
import { minio } from "../src/core/helpers/minio"

// Mock MinIO for tests so external storage service isn't required
minio.upload = async (objectName: string) => objectName
minio.getPresignedUrl = async (objectName: string) => `http://localhost:9000/${config.minio.bucket}/${objectName}`

// ── Test Database ───────────────────────────────────────────────────────────
// Uses real database with a separate test database name
// Ensure DB_TEST_NAME database exists before running tests

const testDbName = process.env.DB_TEST_NAME || "amti_be_test"
const dbType = (process.env.DB_TYPE || config.database.type) as "postgres" | "mysql"

const TestDataSource = new DataSource({
    type: dbType,
    host: config.database.host,
    port: config.database.port,
    username: config.database.user,
    password: config.database.pass,
    database: testDbName,
    synchronize: true,
    dropSchema: true,
    entities: [User, PasswordResetToken, Category, Article, ArticleView, Faq, Role, Permission, Setting, Message],
    logging: false,
})

// ── Database Lifecycle ──────────────────────────────────────────────────────

export async function initTestDatabase() {
    if (!TestDataSource.isInitialized) {
        await TestDataSource.initialize()
    }
    // Override the global AppDataSource so all modules use TestDataSource
    setDataSource(TestDataSource)
}

export async function destroyTestDatabase() {
    if (TestDataSource.isInitialized) {
        await TestDataSource.destroy()
    }
}

export async function cleanTestDatabase() {
    if (!TestDataSource.isInitialized) return

    const queryRunner = TestDataSource.createQueryRunner()
    try {
        if (dbType === "postgres") {
            await queryRunner.query("SET session_replication_role = 'replica'")
        } else {
            await queryRunner.query("SET FOREIGN_KEY_CHECKS = 0")
        }

        const entities = TestDataSource.entityMetadatas
        for (const entity of entities) {
            const quote = dbType === "postgres" ? '"' : '`'
            await queryRunner.query(`DELETE FROM ${quote}${entity.tableName}${quote}`)
        }

        if (dbType === "postgres") {
            await queryRunner.query("SET session_replication_role = 'origin'")
        } else {
            await queryRunner.query("SET FOREIGN_KEY_CHECKS = 1")
        }
    } finally {
        await queryRunner.release()
    }
}

// ── Test App Factory ────────────────────────────────────────────────────────

/**
 * Creates a fresh Hono app with all routes, using TestDataSource.
 * Must be called AFTER initTestDatabase().
 */
export function createTestApp(): Hono {
    // Import routes — they use AppDataSource which is now TestDataSource
    const api = require("../src/routes/api").default

    const app = new Hono()

    app.use("*", requestLogger)
    app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] }))
    app.use("*", languageMiddleware)
    app.route("/api", api)

    // Global Error Handler (matches production)
    app.onError((err, c) => {
        if (err instanceof ZodError) {
            const valErr = new ValidationException(err)
            return ApiResponse.error(c, valErr.message, valErr.status, valErr.context)
        }

        if (err instanceof BaseException) {
            return ApiResponse.error(c, err.message, err.status, err.context)
        }

        return ApiResponse.error(c, "Internal Server Error", 500, {
            message: err.message,
            stack: err.stack,
        })
    })

    return app
}

// ── Request Helper ──────────────────────────────────────────────────────────

interface RequestOptions {
    method?: string
    headers?: Record<string, string>
    body?: any
    token?: string
}

export async function request(app: Hono, path: string, options: RequestOptions = {}) {
    const { method = "GET", headers = {}, body, token } = options

    const reqHeaders: Record<string, string> = { "Content-Type": "application/json", ...headers }
    if (token) {
        reqHeaders["Authorization"] = `Bearer ${token}`
    }

    const init: RequestInit = {
        method,
        headers: reqHeaders,
    }

    if (body) {
        init.body = JSON.stringify(body)
    }

    const res = await app.request(path, init)
    const json = await res.json() as any

    return { status: res.status, body: json, headers: res.headers }
}

// ── Auth Helper ─────────────────────────────────────────────────────────────

export async function registerAndLogin(
    app: Hono,
    userData = { name: "Test User", email: "test@example.com", password: "password123" }
) {
    // Register
    const regRes = await request(app, "/api/auth/register", { method: "POST", body: userData })
    if (!regRes.body.success) {
        throw new Error(`Register failed: ${JSON.stringify(regRes.body)}`)
    }

    // Ensure Super Admin role exists with all permissions for testing
    const permRepo = TestDataSource.getRepository(Permission)
    let allPerms = await permRepo.find()
    if (allPerms.length === 0) {
        const { defaultPermissions } = await import("../src/database/seeders/rbac.seeder")
        await permRepo.save(permRepo.create(defaultPermissions))
        allPerms = await permRepo.find()
    }

    const roleRepo = TestDataSource.getRepository(Role)
    let superAdmin = await roleRepo.findOne({ where: { name: "Super Admin" }, relations: ["permissions"] })
    if (!superAdmin) {
        superAdmin = await roleRepo.save(roleRepo.create({
            name: "Super Admin",
            description: "Super Admin role",
            permissions: allPerms,
        }))
    } else if (!superAdmin.permissions || superAdmin.permissions.length === 0) {
        superAdmin.permissions = allPerms
        await roleRepo.save(superAdmin)
    }
    const userRepo = TestDataSource.getRepository(User)
    await userRepo.update({ id: regRes.body.data.id }, { roleId: superAdmin.id })

    // Login
    const loginRes = await request(app, "/api/auth/login", {
        method: "POST",
        body: { email: userData.email, password: userData.password },
    })
    if (!loginRes.body.success) {
        throw new Error(`Login failed: ${JSON.stringify(loginRes.body)}`)
    }

    return {
        accessToken: loginRes.body.data.accessToken,
        refreshToken: loginRes.body.data.refreshToken,
        headers: { Authorization: `Bearer ${loginRes.body.data.accessToken}` },
        user: loginRes.body.data.user,
    }
}
