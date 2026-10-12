import { Context, Next } from "hono"
import { resolveClientIp } from "../helpers/client-ip"
import { logger } from "../helpers/logger"

declare module "hono" {
    interface ContextVariableMap {
        requestId: string
    }
}

export const requestLogger = async (c: Context, next: Next) => {
    const start = Date.now()
    const requestId = c.req.header("x-request-id") || crypto.randomUUID()
    c.set("requestId", requestId)
    c.header("X-Request-Id", requestId)

    await next()

    const durationMs = Date.now() - start
    const statusCode = c.res.status
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info"

    logger[level]("HTTP request", {
        requestId,
        method: c.req.method,
        path: c.req.path,
        query: c.req.query(),
        statusCode,
        durationMs,
        ip: resolveClientIp(c, { fallbackToSocket: true }),
        userAgent: c.req.header("user-agent"),
    })
}
