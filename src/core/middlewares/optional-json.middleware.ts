import { Context, Next } from "hono"
import { z } from "zod"

/**
 * Validator untuk endpoint yang body JSON-nya **opsional dan boleh rusak**.
 *
 * Berbeda dari `zValidator("json", ...)` yang mengembalikan 400 untuk body kosong
 * atau JSON tidak valid, middleware ini memperlakukan keduanya sebagai `{}`.
 * Perilaku toleran ini dipertahankan dari implementasi lama
 * `POST /content/articles/:id/view` (endpoint beacon publik yang sering dipanggil
 * tanpa body). Controller tetap membaca hasilnya lewat `c.req.valid("json")`.
 */
export const optionalJsonBody = <T extends z.ZodTypeAny>(schema: T) => {
    return async (c: Context, next: Next) => {
        const raw = await c.req.json().catch(() => ({}))
        const parsed = schema.safeParse(raw)

        c.req.addValidatedData("json", parsed.success ? parsed.data : {})

        await next()
    }
}
