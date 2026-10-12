# 🗺️ Project Map — Peta Lengkap File & Dependensi

Dokumen ini berisi peta lengkap semua file dalam proyek, beserta fungsi dan dependensi antar file.

---

## Struktur Lengkap

```
hono-be/
├── docs/                                    # 📚 Dokumentasi proyek
│   ├── README.md                            # Index dokumentasi
│   ├── ARCHITECTURE.md                      # Arsitektur & prinsip desain
│   ├── CODING_STANDARDS.md                  # Standarisasi kode
│   ├── MODULE_GUIDE.md                      # Panduan membuat module baru
│   ├── API_CONVENTIONS.md                   # Konvensi API
│   ├── DATABASE_GUIDE.md                    # Panduan database
│   ├── TESTING_GUIDE.md                     # Panduan testing lengkap
│   ├── LANGUAGE_GUIDE.md                    # Panduan language detection & i18n
│   ├── SWAGGER_GUIDE.md                     # Panduan menulis swagger.yaml
│   ├── LOGGING_GUIDE.md                     # Panduan structured logging & Loki
│   ├── CHANGELOG.md                         # Riwayat perubahan
│   ├── AI_AGENT_RULES.md                    # Aturan untuk AI agent
│   ├── ENVIRONMENT.md                       # Konfigurasi environment
│   └── PROJECT_MAP.md                       # Dokumen ini
│
├── src/
│   ├── index.ts                             # 🚀 Entry point aplikasi
│   │
│   ├── config/
│   │   ├── config.ts                        # ⚙️ Centralized env config
│   │   ├── database.ts                      # 🗄️ TypeORM DataSource + registrasi migrasi
│   │   └── smtp.ts                          # 📧 Nodemailer transporter
│   │
│   ├── core/
│   │   ├── exceptions/
│   │   │   └── base.ts                      # ❌ Custom exception hierarchy (400, 401, 403, 404, 409, 422, 429, 500)
│   │   │
│   │   ├── helpers/
│   │   │   ├── auth.ts                      # 🔑 JWT token & Google OAuth
│   │   │   ├── client-ip.ts                 # 🌍 Resolusi IP client (x-forwarded-for → cf-connecting-ip → socket)
│   │   │   ├── hash.ts                      # 🔒 bcrypt password hashing
│   │   │   ├── i18n.ts                      # 🌐 Message translator (en/id)
│   │   │   ├── logger.ts                    # 📋 Structured JSON logger (stdout/stderr + logs/app-{date}.log)
│   │   │   ├── mail.ts                      # ✉️ Email sender (SMTP)
│   │   │   ├── minio.ts                     # 📦 MinIO object storage
│   │   │   ├── response.ts                  # 📤 API response formatter
│   │   │   ├── slug.ts                      # 🧩 slugify() — dipakai ArticleService & CategoryService
│   │   │   ├── storage-url.ts               # 🖼️ resolveStorageUrl() — path object storage → URL untuk serializer
│   │   │   └── validator.ts                 # ✅ Zod validation hook
│   │   │
│   │   ├── i18n/
│   │   │   ├── en.json                      # 🇬🇧 English messages (master list)
│   │   │   └── id.json                      # 🇮🇩 Indonesian translations
│   │   │
│   │   ├── interfaces/
│   │   │   └── base.repository.interface.ts # 📋 Base repository interface (opsional — lihat catatan di bawah)
│   │   │
│   │   ├── middlewares/
│   │   │   ├── api-key.middleware.ts        # 🔐 API key auth
│   │   │   ├── auth.middleware.ts           # 🛡️ JWT Bearer auth
│   │   │   ├── language.middleware.ts       # 🌐 Accept-Language detection (en/id)
│   │   │   ├── logger.middleware.ts         # 📝 Request access log + X-Request-Id
│   │   │   ├── optional-json.middleware.ts  # 🧩 optionalJsonBody() — body JSON opsional/rusak diperlakukan sebagai {}
│   │   │   ├── rbac.middleware.ts           # 🔏 requirePermission / requireRole
│   │   │   └── token-auth.middleware.ts     # 🎫 JWT via query/header
│   │   │
│   │   └── templates/
│   │       └── email/
│   │           ├── forgot-password.template.ts  # 📨 Template email HTML reset password
│   │           └── index.ts                     # Barrel export template email
│   │
│   ├── database/
│   │   ├── migrations/                      # 🧱 11 migrasi (1 entity = 1 migrasi, 1791364316001–011)
│   │   └── seeders/
│   │       ├── index.ts                     # 🌱 Master seeder (bun run seed)
│   │       ├── rbac.seeder.ts               # 🌱 Permissions & roles default
│   │       ├── setting.seeder.ts            # 🌱 Settings default
│   │       ├── user.seeder.ts               # 🌱 User default
│   │       └── sample-data.seeder.ts        # 🌱 Data contoh (category, article, view, message)
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts               # 🔌 DI wiring
│   │   │   ├── auth.controller.ts           # 🎮 Auth HTTP handlers
│   │   │   ├── auth.service.ts              # 💼 Auth business logic
│   │   │   ├── entities/
│   │   │   │   └── password-reset-token.entity.ts       # 🗄️ Tabel password_reset_tokens
│   │   │   ├── interfaces/
│   │   │   │   └── password-reset-token.repository.interface.ts  # 📋 Repo contract
│   │   │   ├── repositories/
│   │   │   │   └── password-reset-token.repository.ts   # 🗄️ DB access token reset password
│   │   │   ├── serializers/
│   │   │   │   └── auth.serialize.ts        # 📤 Auth response shape
│   │   │   └── validators/
│   │   │       └── auth.validator.ts        # ✅ Auth Zod schemas
│   │   │
│   │   ├── user/
│   │   │   ├── user.module.ts               # 🔌 DI wiring
│   │   │   ├── user.controller.ts           # 🎮 User HTTP handlers
│   │   │   ├── user.service.ts              # 💼 User business logic
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts           # 🗄️ User TypeORM entity
│   │   │   ├── interfaces/
│   │   │   │   └── user.repository.interface.ts  # 📋 User repo contract
│   │   │   ├── repositories/
│   │   │   │   └── user.repository.ts       # 🗄️ User DB access
│   │   │   ├── serializers/
│   │   │   │   ├── user.serialize.ts        # 📤 User detail shape
│   │   │   │   └── user-list.serialize.ts   # 📤 User list shape (dropdown)
│   │   │   └── validators/
│   │   │       └── user.validator.ts        # ✅ User Zod schemas
│   │   │
│   │   ├── content/                         # 🗂️ Menangani 2 domain: article & category
│   │   │   ├── content.module.ts            # 🔌 DI wiring
│   │   │   ├── controllers/                 # ⚠️ subfolder — lihat catatan di bawah
│   │   │   │   ├── article.controller.ts    # 🎮 Article HTTP handlers
│   │   │   │   └── category.controller.ts   # 🎮 Category HTTP handlers
│   │   │   ├── services/                    # ⚠️ subfolder — lihat catatan di bawah
│   │   │   │   ├── article.service.ts       # 💼 Article business logic (slug, cover, view tracking)
│   │   │   │   └── category.service.ts      # 💼 Category business logic (slug)
│   │   │   ├── entities/
│   │   │   │   ├── article.entity.ts        # 🗄️ Article TypeORM entity
│   │   │   │   ├── article-view.entity.ts   # 🗄️ ArticleView TypeORM entity
│   │   │   │   └── category.entity.ts       # 🗄️ Category TypeORM entity
│   │   │   ├── enum/
│   │   │   │   └── article-status.enum.ts   # 🏷️ ArticleStatus (draft, publish)
│   │   │   ├── interfaces/
│   │   │   │   ├── article.repository.interface.ts
│   │   │   │   ├── article-view.repository.interface.ts
│   │   │   │   └── category.repository.interface.ts
│   │   │   ├── repositories/
│   │   │   │   ├── article.repository.ts
│   │   │   │   ├── article-view.repository.ts
│   │   │   │   └── category.repository.ts
│   │   │   ├── serializers/
│   │   │   │   ├── article.serialize.ts     # 📤 Resolusi cover via resolveStorageUrl()
│   │   │   │   ├── article-view.serialize.ts
│   │   │   │   └── category.serialize.ts
│   │   │   └── validators/
│   │   │       ├── article.validator.ts     # ✅ Termasuk RecordViewValidator
│   │   │       └── category.validator.ts
│   │   │
│   │   ├── faq/                             # 🧩 Contoh module CRUD terkecil & paling bersih
│   │   │   ├── faq.module.ts                # 🔌 DI wiring
│   │   │   ├── faq.controller.ts            # 🎮 FAQ HTTP handlers
│   │   │   ├── faq.service.ts               # 💼 FAQ business logic
│   │   │   ├── entities/
│   │   │   │   └── faq.entity.ts            # 🗄️ Faq TypeORM entity
│   │   │   ├── interfaces/
│   │   │   │   └── faq.repository.interface.ts
│   │   │   ├── repositories/
│   │   │   │   └── faq.repository.ts
│   │   │   ├── serializers/
│   │   │   │   └── faq.serialize.ts
│   │   │   └── validators/
│   │   │       └── faq.validator.ts
│   │   │
│   │   ├── rbac/
│   │   │   ├── rbac.module.ts               # 🔌 DI wiring
│   │   │   ├── rbac.controller.ts           # 🎮 Role & permission HTTP handlers
│   │   │   ├── rbac.service.ts              # 💼 RBAC business logic
│   │   │   ├── entities/
│   │   │   │   ├── role.entity.ts           # 🗄️ Role (+ @JoinTable role_permissions)
│   │   │   │   └── permission.entity.ts     # 🗄️ Permission
│   │   │   ├── interfaces/
│   │   │   │   ├── role.repository.interface.ts
│   │   │   │   └── permission.repository.interface.ts
│   │   │   ├── repositories/
│   │   │   │   ├── role.repository.ts
│   │   │   │   └── permission.repository.ts
│   │   │   ├── serializers/
│   │   │   │   ├── role.serialize.ts
│   │   │   │   └── permission.serialize.ts
│   │   │   └── validators/
│   │   │       └── role.validator.ts
│   │   │
│   │   ├── setting/
│   │   │   ├── setting.module.ts            # 🔌 DI wiring
│   │   │   ├── setting.controller.ts        # 🎮 Settings HTTP handlers
│   │   │   ├── setting.service.ts           # 💼 Settings business logic (single-row)
│   │   │   ├── entities/
│   │   │   │   └── setting.entity.ts        # 🗄️ Setting TypeORM entity
│   │   │   ├── interfaces/
│   │   │   │   └── setting.repository.interface.ts
│   │   │   ├── repositories/
│   │   │   │   └── setting.repository.ts
│   │   │   ├── serializers/
│   │   │   │   └── setting.serialize.ts     # 📤 Hanya punya single()
│   │   │   └── validators/
│   │   │       └── setting.validator.ts
│   │   │
│   │   ├── message/
│   │   │   ├── message.module.ts            # 🔌 DI wiring
│   │   │   ├── message.controller.ts        # 🎮 Message HTTP handlers
│   │   │   ├── message.service.ts           # 💼 Message business logic
│   │   │   ├── entities/
│   │   │   │   └── message.entity.ts        # 🗄️ Message TypeORM entity
│   │   │   ├── interfaces/
│   │   │   │   └── message.repository.interface.ts
│   │   │   ├── repositories/
│   │   │   │   └── message.repository.ts
│   │   │   ├── serializers/
│   │   │   │   └── message.serialize.ts
│   │   │   └── validators/
│   │   │       └── message.validator.ts
│   │   │
│   │   ├── dashboard/                       # 📊 Module agregasi — TIDAK punya entity
│   │   │   ├── dashboard.module.ts          # 🔌 DI wiring
│   │   │   ├── dashboard.controller.ts      # 🎮 Statistik & trend HTTP handlers
│   │   │   ├── dashboard.service.ts         # 💼 Agregasi lintas module
│   │   │   ├── interfaces/
│   │   │   │   └── dashboard.repository.interface.ts
│   │   │   ├── repositories/
│   │   │   │   └── dashboard.repository.ts  # 🗄️ Query agregat (read-only)
│   │   │   └── serializers/
│   │   │       └── dashboard.serialize.ts   # 📤 recentArticle(s) + recentMessage(s), tanpa single()/collection()
│   │   │
│   │   └── storage/                         # 📦 Module baru — TIDAK punya entity/repository
│   │       ├── storage.module.ts            # 🔌 DI wiring
│   │       ├── storage.controller.ts        # 🎮 POST /upload & GET /proxy
│   │       └── storage.service.ts           # 💼 Upload ke MinIO + streaming proxy
│   │
│   ├── routes/
│   │   └── api.ts                           # 🛤️ Semua route definitions
│
├── test/                                    # 🧪 E2E test (11 file, 154 test)
│   ├── setup.ts                             # Test DB, app factory, request & auth helper
│   ├── helpers.ts                           # Data factory & assertion utility
│   ├── auth.test.ts
│   ├── content.test.ts
│   ├── dashboard.test.ts
│   ├── email.test.ts
│   ├── faq.test.ts
│   ├── language.test.ts
│   ├── logger.test.ts
│   ├── message.test.ts
│   ├── rbac.test.ts
│   ├── setting.test.ts
│   └── user.test.ts
│
├── .env                                     # 🔒 Environment variables (git-ignored)
├── .env.dist                                # 📋 Environment template
├── .gitignore                               # Git ignore rules
├── .dockerignore                            # Docker ignore rules
├── Dockerfile                               # 🐳 Multi-stage Docker build
├── docker-compose.yaml                      # 🐳 App + PostgreSQL compose
├── ecosystem.config.js                      # 🔄 PM2 process manager config
├── package.json                             # 📦 Dependencies & scripts
├── bun.lock                                 # 🔒 Bun lockfile
├── tsconfig.json                            # ⚙️ TypeScript configuration
├── swagger.yaml                             # 📖 OpenAPI 3.0 specification
└── README.md                                # 📖 Project README
```

> **Catatan struktur:**
> - Module `content` adalah **satu-satunya** module yang memakai subfolder `controllers/` dan `services/`
>   karena menangani dua domain sekaligus (article & category). Ini pengecualian yang disengaja, bukan pelanggaran konvensi.
> - Module `storage` dan `dashboard` tidak punya `entities/`, `interfaces/`, maupun `repositories/`.
>   `storage` murni handler HTTP + MinIO; `dashboard` adalah module agregasi read-only.
> - Folder `src/jobs/` sudah dihapus (isinya hanya placeholder kosong).

---

## Dependency Graph (Antar File)

### Entry Point

```
src/index.ts
    ├── hono (framework)
    ├── hono/cors
    ├── hono/bun (serveStatic)
    ├── @hono/swagger-ui
    ├── zod (ZodError)
    ├── src/config/database.ts          → AppDataSource
    ├── src/config/config.ts            → config
    ├── src/routes/api.ts               → routes
    ├── src/core/helpers/response.ts    → ApiResponse
    ├── src/core/helpers/logger.ts      → logger
    ├── src/core/middlewares/logger.middleware.ts    → requestLogger
    ├── src/core/middlewares/language.middleware.ts  → languageMiddleware
    └── src/core/exceptions/base.ts     → BaseException, ValidationException
```

### Routes

```
src/routes/api.ts
    ├── @hono/zod-validator             → zValidator
    ├── Validators (auth, user, content, faq, rbac, setting, message)
    ├── src/core/middlewares/auth.middleware.ts      → authMiddleware
    ├── src/core/middlewares/rbac.middleware.ts      → requirePermission
    ├── src/core/middlewares/optional-json.middleware.ts → optionalJsonBody
    ├── src/core/helpers/validator.ts                → validationHook
    └── Controllers (dari *.module.ts tiap module):
            ├── src/modules/auth/auth.module.ts           → authController
            ├── src/modules/user/user.module.ts           → userController
            ├── src/modules/content/content.module.ts     → categoryController, articleController
            ├── src/modules/faq/faq.module.ts             → faqController
            ├── src/modules/rbac/rbac.module.ts           → rbacController
            ├── src/modules/setting/setting.module.ts     → settingController
            ├── src/modules/message/message.module.ts     → messageController
            ├── src/modules/dashboard/dashboard.module.ts → dashboardController
            └── src/modules/storage/storage.module.ts     → storageController
```

### Auth Module

```
src/modules/auth/auth.module.ts
    ├── src/modules/user/user.module.ts      → userService
    ├── src/modules/auth/auth.service.ts     → AuthService
    └── src/modules/auth/auth.controller.ts  → AuthController

src/modules/auth/auth.service.ts
    ├── src/config/database.ts               → AppDataSource (for transactions)
    ├── src/config/config.ts                 → config
    ├── src/modules/user/entities/user.entity.ts
    ├── src/modules/auth/entities/password-reset-token.entity.ts
    ├── src/modules/user/user.service.ts     → UserService (injected)
    ├── src/modules/auth/interfaces/password-reset-token.repository.interface.ts (injected)
    ├── src/modules/auth/validators/auth.validator.ts
    ├── src/core/exceptions/base.ts
    ├── src/core/helpers/hash.ts
    ├── src/core/helpers/auth.ts             → AuthHelper
    ├── src/core/helpers/mail.ts             → mail
    ├── src/core/helpers/logger.ts           → logger
    └── hono/jwt (verify)

src/modules/auth/auth.controller.ts
    ├── src/modules/auth/auth.service.ts     → AuthService (injected)
    ├── src/modules/auth/serializers/auth.serialize.ts
    ├── src/core/helpers/response.ts         → ApiResponse
    └── src/core/exceptions/base.ts
```

### User Module

```
src/modules/user/user.module.ts
    ├── src/modules/user/repositories/user.repository.ts
    ├── src/modules/user/user.service.ts
    └── src/modules/user/user.controller.ts

src/modules/user/user.service.ts
    ├── src/modules/user/entities/user.entity.ts
    ├── src/modules/user/interfaces/user.repository.interface.ts  → IUserRepository (injected)
    ├── src/core/helpers/hash.ts             → hashPassword
    ├── src/core/helpers/minio.ts            → minio.sanitizePath
    └── src/core/exceptions/base.ts

src/modules/user/user.repository.ts
    ├── src/config/database.ts               → AppDataSource
    ├── src/modules/user/entities/user.entity.ts
    └── src/modules/user/interfaces/user.repository.interface.ts
```

### FAQ Module (contoh module CRUD standar)

```
src/modules/faq/faq.module.ts
    ├── src/modules/faq/repositories/faq.repository.ts
    ├── src/modules/faq/faq.service.ts
    └── src/modules/faq/faq.controller.ts

src/modules/faq/faq.service.ts
    ├── src/modules/faq/entities/faq.entity.ts
    ├── src/modules/faq/interfaces/faq.repository.interface.ts → IFaqRepository (injected)
    └── src/core/exceptions/base.ts

src/modules/faq/faq.controller.ts
    ├── src/modules/faq/faq.service.ts       → FaqService (injected)
    ├── src/modules/faq/serializers/faq.serialize.ts
    └── src/core/helpers/response.ts         → ApiResponse
```

### Content Module

```
src/modules/content/content.module.ts
    ├── repositories (article, article-view, category)
    ├── services (ArticleService, CategoryService)
    └── controllers (ArticleController, CategoryController)

src/modules/content/services/article.service.ts
    ├── src/core/helpers/slug.ts             → slugify
    ├── src/core/helpers/minio.ts            → minio.sanitizePath
    ├── src/core/exceptions/base.ts
    └── repository interfaces (article, category, article-view — injected)

src/modules/content/controllers/article.controller.ts
    ├── src/core/helpers/client-ip.ts        → resolveClientIp
    ├── src/modules/content/services/article.service.ts
    └── src/modules/content/serializers/article.serialize.ts
```

### Storage Module

```
src/modules/storage/storage.module.ts
    ├── src/modules/storage/storage.service.ts
    └── src/modules/storage/storage.controller.ts

src/modules/storage/storage.service.ts
    ├── src/core/helpers/minio.ts            → minio.upload, minio.proxyHandler
    ├── src/core/exceptions/base.ts          → BadRequestException
    └── node:crypto                           → randomUUID

src/modules/storage/storage.controller.ts
    ├── src/modules/storage/storage.service.ts (injected)
    └── src/core/helpers/response.ts         → ApiResponse
```

### Core Helpers

```
src/core/helpers/auth.ts
    ├── hono/jwt (sign)
    ├── google-auth-library (OAuth2Client)
    └── src/config/config.ts

src/core/helpers/mail.ts
    ├── src/config/smtp.ts      → transporter
    ├── src/config/config.ts    → config.mail.from
    ├── src/core/exceptions/base.ts → InternalServerException
    └── src/core/helpers/logger.ts  → logger

src/core/helpers/minio.ts
    ├── minio (Client)
    ├── node:stream (Readable)
    └── src/config/config.ts

src/core/helpers/storage-url.ts
    └── src/core/helpers/minio.ts  → minio.getPresignedUrl
        (dipakai 7 serializer: auth, user, user-list, article, role, setting, dashboard)

src/core/helpers/slug.ts
    └── (tidak ada dependency — pure function)
        (dipakai ArticleService & CategoryService)

src/core/helpers/client-ip.ts
    ├── hono (Context)
    └── hono/bun (getConnInfo)
        (dipakai logger.middleware.ts & article.controller.ts)

src/core/helpers/response.ts
    ├── hono (Context)
    ├── hono/utils/http-status (ContentfulStatusCode)
    └── src/core/helpers/i18n.ts  → translate

src/core/middlewares/auth.middleware.ts
    ├── hono/jwt (verify)
    ├── src/config/config.ts
    ├── src/config/database.ts
    ├── src/modules/user/entities/user.entity.ts
    └── src/core/exceptions/base.ts
```

---

## Dependencies (package.json)

### Production

| Package | Versi | Fungsi |
|---------|-------|--------|
| `hono` | ^4.12.8 | Web framework |
| `@hono/swagger-ui` | ^0.6.1 | Swagger UI middleware |
| `@hono/zod-validator` | ^0.7.6 | Zod validation untuk Hono |
| `zod` | ^4.3.6 | Schema validation |
| `typeorm` | ^0.3.28 | ORM |
| `reflect-metadata` | ^0.2.2 | Required by TypeORM decorators |
| `pg` | ^8.16.0 | PostgreSQL driver |
| `mysql2` | ^3.20.0 | MySQL driver |
| `bcryptjs` | ^3.0.3 | Password hashing |
| `nodemailer` | ^8.0.3 | Email sending |
| `google-auth-library` | ^10.7.0 | Google OAuth |
| `minio` | ^8.0.7 | MinIO object storage client |

### Dev Dependencies

| Package | Versi | Fungsi |
|---------|-------|--------|
| `@types/bun` | latest | Bun type definitions |
| `@types/bcryptjs` | ^3.0.0 | bcryptjs type definitions |
| `@types/nodemailer` | ^7.0.11 | Nodemailer type definitions |

---

## NPM Scripts

| Script | Command | Deskripsi |
|--------|---------|-----------|
| `dev` | `bun run --hot src/index.ts` | Development dengan hot-reload |
| `build` | `bun build --minify --outfile dist/index.js --target bun src/index.ts` | Production build |
| `start` | `bun run src/index.ts` | Start dari source |
| `test` | `bun test --timeout 30000` | Jalankan seluruh test E2E |
| `migration:run` | `bun run ./node_modules/typeorm/cli.js migration:run -d src/config/database.ts` | Jalankan migrasi yang belum dieksekusi |
| `migration:revert` | `bun run ./node_modules/typeorm/cli.js migration:revert -d src/config/database.ts` | Rollback migrasi terakhir |
| `migration:show` | `bun run ./node_modules/typeorm/cli.js migration:show -d src/config/database.ts` | Tampilkan status migrasi |
| `migration:generate` | `bun run ./node_modules/typeorm/cli.js migration:generate` | Generate migrasi dari perubahan entity |
| `migration:create` | `bun run ./node_modules/typeorm/cli.js migration:create` | Buat file migrasi kosong |
| `seed` | `bun run src/database/seeders/index.ts` | Jalankan semua seeder |
| `seed:rbac` | `bun run src/database/seeders/rbac.seeder.ts` | Seeder permissions & roles |
| `seed:users` | `bun run src/database/seeders/user.seeder.ts` | Seeder user default |
| `seed:settings` | `bun run src/database/seeders/setting.seeder.ts` | Seeder settings default |
