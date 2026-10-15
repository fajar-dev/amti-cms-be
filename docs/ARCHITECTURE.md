# 🏗️ Arsitektur Proyek

## Prinsip Desain

Proyek ini menggunakan **Clean Architecture** dengan prinsip:

- **SOLID Principles** — Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **Dependency Injection (Manual)** — Wiring dilakukan di `*.module.ts` (Composition Root)
- **Repository Pattern** — Abstraksi akses data melalui interface
- **Separation of Concerns** — Setiap layer memiliki tanggung jawab yang jelas

---

## Layer Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Presentation Layer                                      │
│  Controller → Menerima HTTP request, mengembalikan       │
│               response via ApiResponse                   │
├──────────────────────────────────────────────────────────┤
│  Application Layer                                       │
│  Service → Business logic, orchestration, use cases      │
├──────────────────────────────────────────────────────────┤
│  Domain Layer                                            │
│  Interface → Kontrak repository (IXxxRepository)         │
│  Entity → TypeORM entity model                           │
├──────────────────────────────────────────────────────────┤
│  Infrastructure Layer                                    │
│  TypeORM Repository → Implementasi akses database        │
│  Helpers → Auth, Mail, MinIO, Hash, Logger, Slug,        │
│            StorageUrl, ClientIp                          │
└──────────────────────────────────────────────────────────┘
```

---

## Dependency Flow

```
src/index.ts                          ← Entry point, konfigurasi Hono app
    │
    ├─ src/routes/api.ts              ← Definisi seluruh route
    │       │
    │       ├─ Validators             ← Zod schema untuk validasi request body
    │       ├─ Middlewares            ← Auth guard (JWT / API Key)
    │       └─ Controllers            ← Di-import dari *.module.ts
    │
    └─ src/modules/{module}/
            │
            ├─ {module}.module.ts     ← Composition Root (wiring DI)
            │       │
            │       ├─ Repository     ← new TypeOrmXxxRepository()
            │       ├─ Service        ← new XxxService(repository)
            │       └─ Controller     ← new XxxController(service)
            │
            ├─ entities/              ← TypeORM entity
            ├─ interfaces/            ← Repository interface
            ├─ repositories/          ← TypeORM implementation
            ├─ validators/            ← Zod validation schemas
            └─ serializers/           ← Response data transformation
```

---

## Alur Request

```
HTTP Request
    │
    ▼
[CORS Middleware]
    │
    ▼
[Route Matching] (src/routes/api.ts)
    │
    ▼
[Validation Middleware] (zValidator + validationHook)
    │   → Jika gagal: throw ValidatorException → 422
    │
    ▼
[Auth Middleware] (opsional, per-route)
    │   → authMiddleware:     JWT Bearer token
    │   → apiKeyMiddleware:   x-api-key header
    │   → tokenAuthMiddleware: JWT via query param atau header
    │
    ▼
[Controller] → Menerima Context, memanggil Service
    │
    ▼
[Service] → Business logic, memanggil Repository
    │
    ▼
[Repository] → Akses database via TypeORM
    │
    ▼
[Serializer] → Transform entity ke response shape
    │
    ▼
[ApiResponse] → Format JSON response standar
    │
    ▼
HTTP Response
```

---

## Global Error Handling

Error ditangani di `src/index.ts` → `app.onError()`:

| Error Type | Status | Handling |
|------------|--------|----------|
| `ZodError` | 422 | Di-wrap ke `ValidatorException`, mengembalikan array field errors |
| `BaseException` (dan subclass) | Sesuai subclass | Mengembalikan `message`, `status`, dan `context` |
| Unknown Error | 500 | Log JSON ke `logs/app-{date}.log`, tampilkan stack trace hanya di `development` |

---

## Module yang Tersedia

| Module | Path | Deskripsi | Memiliki Controller |
|--------|------|-----------|---------------------|
| `auth` | `src/modules/auth/` | Register, login, Google OAuth, refresh token, reset password | ✅ |
| `user` | `src/modules/user/` | CRUD user & daftar ringkas (dropdown) | ✅ |
| `content` | `src/modules/content/` | Category, Article, dan ArticleView (2 domain, pakai subfolder `controllers/` & `services/`) | ✅ |
| `faq` | `src/modules/faq/` | CRUD FAQ dengan pagination & search | ✅ |
| `rbac` | `src/modules/rbac/` | Role, permission, dan relasi many-to-many `role_permissions` | ✅ |
| `setting` | `src/modules/setting/` | Website settings single-row (contact, social media; SEO static in frontend) | ✅ |
| `message` | `src/modules/message/` | Pesan kontak masuk: create publik + manajemen admin | ✅ |
| `dashboard` | `src/modules/dashboard/` | Agregasi statistik & trend untuk admin dashboard — **tanpa entity** (read-only) | ✅ |
| `storage` | `src/modules/storage/` | Upload file & proxy object storage — **tanpa entity/repository** | ✅ |

---

## Infrastruktur Bersama (core/)

| Komponen | Path | Fungsi |
|----------|------|--------|
| **Exceptions** | `core/exceptions/base.ts` | Hierarki custom exception (400, 401, 403, 404, 409, 422, 429, 500) — termasuk `InternalServerException` |
| **ApiResponse** | `core/helpers/response.ts` | Format response standar (success, paginate, error) |
| **AuthHelper** | `core/helpers/auth.ts` | JWT token generation & Google OAuth verification |
| **Hash** | `core/helpers/hash.ts` | bcrypt password hashing & comparison |
| **Mail** | `core/helpers/mail.ts` | Singleton Nodemailer wrapper (sendText, sendHtml) |
| **MinIO** | `core/helpers/minio.ts` | Singleton MinIO wrapper (upload, delete, presignedUrl, proxy) |
| **Slug** | `core/helpers/slug.ts` | `slugify()` — dipakai `ArticleService` & `CategoryService` |
| **Storage URL** | `core/helpers/storage-url.ts` | `resolveStorageUrl()` — path object storage → URL untuk serializer; opsi `passthroughAbsolute` & `fallbackToPath`. Dipakai 7 serializer (auth, user, user-list, article, role, setting, dashboard) |
| **Client IP** | `core/helpers/client-ip.ts` | `resolveClientIp()` — `x-forwarded-for` → `cf-connecting-ip` → (opsional) alamat socket; dipakai `logger.middleware.ts` & `article.controller.ts` |
| **Logger** | `core/helpers/logger.ts` | Structured JSON logger (stdout/stderr + `logs/app-{date}.log`, semua level), lihat `LOGGING_GUIDE.md` |
| **Validator** | `core/helpers/validator.ts` | Zod validation hook untuk Hono |
| **i18n** | `core/helpers/i18n.ts` | `translate()` — kamus message en/id (`core/i18n/`) |
| **Template Email** | `core/templates/email/` | Template email (mis. `forgot-password.template.ts`) |
| **Auth Middleware** | `core/middlewares/auth.middleware.ts` | JWT Bearer token verification |
| **API Key Middleware** | `core/middlewares/api-key.middleware.ts` | x-api-key header verification |
| **Token Auth Middleware** | `core/middlewares/token-auth.middleware.ts` | JWT via query param atau header |
| **RBAC Middleware** | `core/middlewares/rbac.middleware.ts` | `requirePermission` / `requireRole` |
| **Request Logger** | `core/middlewares/logger.middleware.ts` | Access log JSON per request + `X-Request-Id` |
| **Language Middleware** | `core/middlewares/language.middleware.ts` | Deteksi `Accept-Language` → `c.set("language", ...)` + header `Content-Language` |
| **Optional JSON Middleware** | `core/middlewares/optional-json.middleware.ts` | `optionalJsonBody()` — validator untuk body opsional/rusak (dipakai `POST /api/content/articles/:id/view`) |

---

## Konfigurasi

| File | Fungsi |
|------|--------|
| `src/config/config.ts` | Centralized environment config object |
| `src/config/database.ts` | TypeORM DataSource configuration |
| `src/config/smtp.ts` | Nodemailer transporter configuration |

### Live chat transaction boundary

`LiveChatController` validates HTTP inputs through route Zod middleware and delegates to `LiveChatService`.
`IChatSessionRepository.mutate` executes a synchronous domain mutation supplied by the service against a locked session, then persists the session and optional message in one transaction.
`createWithMessage` atomically creates a session and its initial message. `markRead` uses the same row-lock boundary for unread counters and message read flags.
The service never receives a TypeORM manager or imports the data source. `TypeOrmChatMessageRepository` is a read-only history repository. DI is wired in `livechat.module.ts`.
