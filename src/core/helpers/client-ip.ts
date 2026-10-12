import { Context } from "hono"
import { getConnInfo } from "hono/bun"

export interface ResolveClientIpOptions {
    /**
     * Pakai alamat socket sebagai fallback terakhir kalau tidak ada header proxy.
     * Nonaktif secara default supaya pemanggil lama (view tracker) tetap
     * menyimpan `null` saat request tidak melewati proxy.
     */
    fallbackToSocket?: boolean
}

/**
 * Menentukan IP client dari header proxy, dengan urutan:
 * `x-forwarded-for` → `cf-connecting-ip` → (opsional) alamat socket.
 */
export function resolveClientIp(c: Context, options: ResolveClientIpOptions = {}): string | undefined {
    const { fallbackToSocket = false } = options

    const forwarded = c.req.header("x-forwarded-for")
    if (forwarded) return forwarded.split(",")[0].trim()

    const cloudflare = c.req.header("cf-connecting-ip")
    if (cloudflare) return cloudflare

    if (!fallbackToSocket) return undefined

    try {
        return getConnInfo(c).remote.address
    } catch {
        return undefined
    }
}
