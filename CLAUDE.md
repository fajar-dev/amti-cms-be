# Hono BE — Project Instructions for Claude Code

Kamu adalah AI agent yang bekerja pada proyek **Hono BE Backend Boilerplate**. Proyek ini menggunakan **Hono + Bun + TypeORM** dengan arsitektur **Clean Architecture**.

**WAJIB baca file `docs/AI_AGENT_RULES.md` sebelum menulis kode apapun.**

> Isi yang sama juga tersedia di `AGENTS.md` (format standar lintas-tool untuk AI agent selain
> Claude Code — Cursor, Codex CLI, Copilot, Aider, dll). **Kedua file harus tetap sinkron.**

---

## Tech Stack

- Runtime: Bun
- Framework: Hono (bukan Express, bukan Fastify)
- ORM: TypeORM (bukan Drizzle, bukan Prisma)
- Validation: Zod + @hono/zod-validator
- Auth: JWT via hono/jwt (bukan jsonwebtoken)
- Database: PostgreSQL / MySQL (via DB_TYPE env)
- Email: Nodemailer
- Object Storage: MinIO

## Arsitektur (WAJIB DIIKUTI)

```
Controller → Service → Repository (via Interface)
```

- **Controller**: HTTP handler, hanya memanggil service dan mengembalikan ApiResponse
- **Service**: Business logic, menerima repository interface via constructor. **TIDAK BOLEH** import AppDataSource atau akses database langsung.
- **Repository**: Akses database via TypeORM, implements interface
- **Module** (`*.module.ts`): Satu-satunya tempat wiring DI (Composition Root)

## Aturan Mutlak

1. **JANGAN** menulis query database di controller
2. **JANGAN** membuat format response sendiri → gunakan `ApiResponse` dari `src/core/helpers/response.ts`
3. **JANGAN** akses `process.env` langsung → gunakan `config` dari `src/config/config.ts`
4. **JANGAN** taruh business logic di controller → hanya di service
5. **JANGAN** throw generic `Error()` → gunakan custom exception dari `src/core/exceptions/base.ts`
6. **JANGAN** expose data sensitif (password, token) → gunakan Serializer
7. **JANGAN** instantiate service/repository di controller → wiring hanya di `*.module.ts`
8. **JANGAN** import `AppDataSource` di service → transaction dikelola di repository layer
9. **JANGAN** gunakan `c.req.json()` di controller → gunakan `c.req.valid("json" as never)` agar Zod validation berjalan
10. **JANGAN** pakai `console.log`/`console.error` langsung → gunakan `logger` dari `src/core/helpers/logger.ts` (baca `docs/LOGGING_GUIDE.md`)

## Membuat Module Baru

Baca panduan lengkap: `docs/MODULE_GUIDE.md`

Checklist:
1. `enum/{nama}.enum.ts` — Enum (opsional, hanya jika ada field enum)
2. `entities/{nama}.entity.ts` — TypeORM entity (opsional, jika module tidak punya tabel sendiri)
3. `interfaces/{nama}.repository.interface.ts` — Repository contract (opsional `extends IBaseRepository<T>`)
4. `repositories/{nama}.repository.ts` — TypeORM implementation
5. `{nama}.service.ts` — Business logic
6. `{nama}.controller.ts` — HTTP handlers (gunakan `c.req.valid()`, bukan `c.req.json()`)
7. `validators/{nama}.validator.ts` — Zod schemas
8. `serializers/{nama}.serialize.ts` — Response transform (standarnya `single()` + `collection()`)
9. `{nama}.module.ts` — DI wiring (Composition Root)
10. Daftarkan entity di `src/config/database.ts` → array `entities` (lewati jika tidak ada entity)
11. Tambahkan route di `src/routes/api.ts`
12. Buat test E2E di `test/{nama}.test.ts`
13. Tambahkan data factory di `test/helpers.ts`
14. Update `swagger.yaml` (baca `docs/SWAGGER_GUIDE.md`)
15. Update `docs/CHANGELOG.md`
16. Jalankan `bun test` → pastikan semua pass

> Tidak semua module punya entity/repository (contoh: `storage`, `dashboard`) dan tidak semua serializer
> punya `single()`/`collection()` (contoh: `DashboardSerializer`, `SettingSerializer`).
> Lihat "Catatan Konvensi" di bawah.

## Naming Conventions

### Files (kebab-case)
- Enum: `{nama}.enum.ts` (di dalam folder `enum/`, singular)
- Entity: `{nama}.entity.ts`
- Repo interface: `{nama}.repository.interface.ts`
- Repo implementation: `{nama}.repository.ts`
- Service: `{nama}.service.ts`
- Controller: `{nama}.controller.ts`
- Validator: `{nama}.validator.ts`
- Serializer: `{nama}.serialize.ts`
- Module: `{nama}.module.ts`
- Middleware: `{nama}.middleware.ts`
- Template email: `{nama}.template.ts` (di dalam folder `templates/email/`)
- Test: `{nama}.test.ts`

### Classes (PascalCase)
- Enum: nama deskriptif, tanpa prefix nama module (`ArticleStatus`, bukan `ArticleStatusEnum`)
- Entity: `Invoice`
- Repo interface: `IInvoiceRepository`
- Repo implementation: `TypeOrmInvoiceRepository`
- Service: `InvoiceService`
- Controller: `InvoiceController`
- Serializer: `InvoiceSerializer`

### Database
- Tabel: `snake_case`, plural (`invoices`)
- Kolom: `snake_case` (`created_at`, `is_active`)
- Property entity: `camelCase` (`createdAt`, `isActive`)

### Exception Classes
- `BadRequestException` (400)
- `UnauthorizedException` (401)
- `ForbiddenException` (403)
- `NotFoundException` (404)
- `ConflictException` (409)
- `ValidationException` (422) — untuk Zod errors
- `TooManyRequestsException` (429)
- `InternalServerException` (500) — error tak terduga / kegagalan dependency eksternal

## Response Format Standar

```typescript
// Success
ApiResponse.success(c, data, "Message", 200)
ApiResponse.success(c, data, "Created", 201)

// Pagination
ApiResponse.paginate(c, data, total, page, limit, "Message")

// Error (via exception, BUKAN manual)
throw new NotFoundException("Resource not found")
throw new BadRequestException("Invalid input")
throw new UnauthorizedException("Not authenticated")
```

## Controller Pattern

```typescript
export class XxxController {
    constructor(private readonly service: XxxService) {}

    async index(c: Context) {
        const page = Number(c.req.query("page") || 1)
        const limit = Number(c.req.query("limit") || 10)
        const q = c.req.query("q") || ""
        const { data, total } = await this.service.getAll(page, limit, q)
        return ApiResponse.paginate(c, XxxSerializer.collection(data), total, page, limit)
    }

    async show(c: Context) {
        const id = Number(c.req.param("id"))
        const item = await this.service.getById(id)
        return ApiResponse.success(c, XxxSerializer.single(item))
    }

    async store(c: Context) {
        const data = c.req.valid("json" as never)  // BUKAN c.req.json()
        const item = await this.service.create(data)
        return ApiResponse.success(c, XxxSerializer.single(item), "Created", 201)
    }

    async update(c: Context) {
        const id = Number(c.req.param("id"))
        const data = c.req.valid("json" as never)  // BUKAN c.req.json()
        const item = await this.service.update(id, data)
        return ApiResponse.success(c, XxxSerializer.single(item), "Updated")
    }

    async destroy(c: Context) {
        const id = Number(c.req.param("id"))
        await this.service.delete(id)
        return ApiResponse.success(c, null, "Deleted")
    }
}
```

## Route Pattern

```typescript
routes.get("/{resource}", authMiddleware, (c) => xxxController.index(c))
routes.get("/{resource}/:id", authMiddleware, (c) => xxxController.show(c))
routes.post("/{resource}", authMiddleware, zValidator("json", CreateXxxValidator, validationHook), (c) => xxxController.store(c))
routes.put("/{resource}/:id", authMiddleware, zValidator("json", UpdateXxxValidator, validationHook), (c) => xxxController.update(c))
routes.delete("/{resource}/:id", authMiddleware, (c) => xxxController.destroy(c))
```

## Language Detection & Pesan Response

- Bahasa dideteksi dari header `Accept-Language`, bukan query string atau cookie.
- Didukung: `en` (default) dan `id`. Header tidak dikirim atau bahasa tidak didukung → fallback `en`.
- Bahasa yang terdeteksi tersedia via `c.get("language")` di controller/service, dan dikembalikan ke client melalui response header `Content-Language`.
- Middleware: `src/core/middlewares/language.middleware.ts`, didaftarkan global di `src/index.ts` (dan `test/setup.ts` untuk test).
- Message pada `ApiResponse.success/paginate/error` (termasuk message dari exception dan field error Zod) **otomatis diterjemahkan** ke Indonesia jika bahasa terdeteksi `id`, via `translate()` di `src/core/helpers/i18n.ts`.
- Tulis message di controller/service/exception/validator **selalu dalam Bahasa Inggris seperti biasa** (string ini jadi key kamus) — JANGAN hardcode Bahasa Indonesia di kode.
- Kamus terjemahan disimpan sebagai JSON, key harus identik (case-sensitive) di kedua file:
  - `src/core/i18n/en.json` — key = value (teks Inggris asli, sekaligus daftar master semua message yang bisa diterjemahkan)
  - `src/core/i18n/id.json` — key sama, value = terjemahan Indonesia
- Menambah message baru: tambahkan key yang sama di **kedua** file. Jika key tidak ada di `id.json`, otomatis fallback ke teks Inggris aslinya (tidak error).

## File Referensi Penting

| Kebutuhan | File |
|-----------|------|
| Config env | `src/config/config.ts` |
| Database | `src/config/database.ts` |
| Exceptions | `src/core/exceptions/base.ts` |
| Response format | `src/core/helpers/response.ts` |
| Validation hook | `src/core/helpers/validator.ts` |
| JWT/Auth | `src/core/helpers/auth.ts` |
| Password | `src/core/helpers/hash.ts` |
| Email | `src/core/helpers/mail.ts` |
| File storage | `src/core/helpers/minio.ts` |
| Slug | `src/core/helpers/slug.ts` — `slugify()` |
| URL object storage | `src/core/helpers/storage-url.ts` — `resolveStorageUrl()` |
| IP client | `src/core/helpers/client-ip.ts` — `resolveClientIp()` |
| Structured logger (JSON) | `src/core/helpers/logger.ts` |
| Request access log | `src/core/middlewares/logger.middleware.ts` |
| Language detection | `src/core/middlewares/language.middleware.ts` |
| RBAC guard | `src/core/middlewares/rbac.middleware.ts` |
| Body JSON opsional | `src/core/middlewares/optional-json.middleware.ts` |
| Template email | `src/core/templates/email/` |
| Terjemahan pesan | `src/core/helpers/i18n.ts`, `src/core/i18n/en.json`, `src/core/i18n/id.json` |
| Migrasi | `src/database/migrations/` |
| Seeder | `src/database/seeders/` |
| Routes | `src/routes/api.ts` |
| Swagger | `swagger.yaml` |
| Test setup | `test/setup.ts` |
| Test helpers | `test/helpers.ts` |
| Health check | `GET /health` |

## Catatan Konvensi (Jangan Dianggap Inkonsistensi)

Beberapa hal berikut **disengaja** dan bukan pelanggaran konvensi:

- **Nama file serializer** wajib ikut pola `{nama}.serialize.ts` (`dashboard.serialize.ts`, bukan `dashboard.serializer.ts`).
- **`single()`/`collection()`** adalah pola standar tapi tidak wajib: `DashboardSerializer` memakai `recentArticle(s)`/`recentMessage(s)`, `SettingSerializer` hanya `single()` (module single-row).
- **`IBaseRepository<T>` opsional** — dipakai 7 repository CRUD; repository read-only/agregat (`IRoleRepository`, `IPermissionRepository`, `ISettingRepository`, `IDashboardRepository`) tidak memakainya.
- **Default sort berbeda per module** — `faq` & `rbac` default `ASC`; `article`, `category`, `user`, `message` default `DESC`. Pilih sesuai domain module barumu.
- **Module tanpa entity/repository** itu sah — `storage` (handler upload/proxy) dan `dashboard` (agregasi read-only).
- **Module `content`** memakai subfolder `controllers/` dan `services/` karena menangani 2 domain (article & category).
- **Style**: 4 spasi, double quotes, tanpa semicolon. File di `src/database/migrations/` dibiarkan memakai semicolon (artefak historis).
- **Seeder** memakai `logger` (output JSON), bukan `console.log`.
- **`process.env` langsung** diizinkan hanya di harness test (`test/setup.ts`), bukan di `src/`.

## Testing (WAJIB)

Setiap perubahan **WAJIB** disertai test E2E.

### Menjalankan Test

```bash
DB_TYPE=mysql bun test
```

### Checklist Testing untuk Fitur Baru

```
☐ Buat/update test file: test/{module}.test.ts
☐ Tambahkan data factory di test/helpers.ts
☐ Test: auth required (semua endpoint)
☐ Test: create (success + validation errors)
☐ Test: list (empty, data, pagination, search)
☐ Test: show (success + 404)
☐ Test: update (success + partial + 404)
☐ Test: delete (success + 404 + verify deleted)
☐ Test: full CRUD lifecycle
☐ Update swagger.yaml
☐ Update docs/CHANGELOG.md
☐ Jalankan bun test → semua HARUS pass
```

### File Test yang Ada

Total: **193 test di 14 file**.

| File | Tests |
|------|-------|
| `test/auth.test.ts` | 38 test — register, login, refresh, me, logout, forgot/reset password, profile |
| `test/user.test.ts` | 22 test — CRUD user, list ringkas, filter, pagination, upload file |
| `test/content.test.ts` | 22 test — kategori, artikel, slug, SEO, views tracking |
| `test/setting.test.ts` | 15 test — settings publik, contact/social, static SEO, RBAC & validasi |
| `test/language.test.ts` | 12 test — deteksi bahasa, message terjemahan, konsistensi kamus |
| `test/rbac.test.ts` | 12 test — role & permission, enforcement akses |
| `test/message.test.ts` | 11 test — submit publik, manajemen admin, status baca |
| `test/faq.test.ts` | 10 test — CRUD, filter status aktif, pagination |
| `test/logger.test.ts` | 8 test — structured logger, `requestLogger` middleware |
| `test/dashboard.test.ts` | 7 test — endpoint statistik & trend |
| `test/email.test.ts` | 3 test — template email forgot password |
| `test/client.test.ts` | 12 test — CRUD client |
| `test/livechat.test.ts` | 14 test — visitor, staff, RBAC, concurrency, history |
| `test/livechat-service.test.ts` | 7 test — domain rules tanpa database |

## Production Safety

| Rule | Behavior |
|------|----------|
| `JWT_SECRET` tidak di-set di production | ❌ Server crash saat startup |
| `JWT_REFRESH_SECRET` tidak di-set | ❌ Server crash saat startup |
| `API_KEY` tidak di-set | ❌ Server crash saat startup |
| `DB_SYNC=true` di production | ⚠️ Otomatis diubah ke `false` |
| Stack trace di response | ⚠️ Hidden di production |

## Dokumentasi Lengkap

Baca semua file di folder `docs/` untuk detail lebih lanjut:
- `docs/ARCHITECTURE.md` — Arsitektur & layer design
- `docs/CODING_STANDARDS.md` — Konvensi kode lengkap
- `docs/MODULE_GUIDE.md` — Step-by-step membuat module
- `docs/API_CONVENTIONS.md` — Standar API response & error
- `docs/DATABASE_GUIDE.md` — Entity, repository, query patterns
- `docs/TESTING_GUIDE.md` — Panduan testing lengkap + template
- `docs/LANGUAGE_GUIDE.md` — Panduan language detection & terjemahan message (i18n)
- `docs/SWAGGER_GUIDE.md` — Panduan menulis & memvalidasi `swagger.yaml`
- `docs/LOGGING_GUIDE.md` — Panduan structured logging (JSON) & integrasi Grafana Loki
- `docs/CHANGELOG.md` — Riwayat perubahan
- `docs/ENVIRONMENT.md` — Environment variables & deployment
- `docs/PROJECT_MAP.md` — Peta file & dependency graph
- `docs/AI_AGENT_RULES.md` — Aturan lengkap untuk AI agent
