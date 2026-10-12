# Hono BE — Backend Boilerplate

API Backend boilerplate dibangun dengan **Hono**, **Bun**, dan **TypeORM**.

---

## Tech Stack

| Kategori       | Library / Tool             |
| -------------- | -------------------------- |
| Runtime        | [Bun](https://bun.sh)      |
| Framework      | [Hono](https://hono.dev)   |
| Database       | MySQL 8+                   |
| ORM            | TypeORM                    |
| Validasi       | Zod + @hono/zod-validator  |
| Auth           | JWT (HS256) via `hono/jwt` |
| Email          | Nodemailer (SMTP)          |
| Object Storage | MinIO                      |
| Proses Manager | PM2                        |

---

## Arsitektur

Proyek ini menggunakan **Clean Architecture** dengan prinsip **SOLID**, **Dependency Injection**, dan **Repository Pattern**.

### Lapisan (Layer)

```
┌──────────────────────────────────────┐
│           Presentation Layer          │
│   Controller → HTTP req/res handler  │
├──────────────────────────────────────┤
│           Application Layer          │
│   Service → Bisnis logik & use case  │
├──────────────────────────────────────┤
│             Domain Layer             │
│   Repository Interface → Kontrak     │
├──────────────────────────────────────┤
│         Infrastructure Layer         │
│   TypeORM Repository → Akses data    │
└──────────────────────────────────────┘
```

### Alur Dependency

```
routes/api.ts
    │
    └─ {module}.module.ts          ← Composition Root (wiring DI)
           ├─ Repository (TypeORM) ← implements Interface
           ├─ Service              ← menerima Interface via constructor
           └─ Controller           ← menerima Service via constructor
```

---

## Struktur Proyek

```
hono-be/
├── src/
│   ├── config/                        # Konfigurasi aplikasi
│   │   ├── config.ts                  # Env variables (app, db, mail, minio, google)
│   │   ├── database.ts                # TypeORM DataSource
│   │   └── smtp.ts                    # Nodemailer transporter
│   │
│   ├── core/                          # Infrastruktur bersama
│   │   ├── exceptions/
│   │   │   └── base.ts                # Hierarki custom exception (400–500)
│   │   ├── helpers/
│   │   │   ├── auth.ts                # Google OAuth & JWT token helper
│   │   │   ├── client-ip.ts           # Resolusi IP client (proxy-aware)
│   │   │   ├── hash.ts                # bcrypt password hashing
│   │   │   ├── i18n.ts                # translate() untuk message response
│   │   │   ├── logger.ts              # Structured logger (JSON)
│   │   │   ├── mail.ts                # Wrapper Nodemailer
│   │   │   ├── minio.ts               # MinIO object storage helper
│   │   │   ├── response.ts            # ApiResponse formatter
│   │   │   ├── slug.ts                # slugify() generator slug
│   │   │   ├── storage-url.ts         # resolveStorageUrl() presigned URL
│   │   │   └── validator.ts           # Zod validation hook
│   │   ├── i18n/
│   │   │   ├── en.json                # Kamus message Inggris (master)
│   │   │   └── id.json                # Terjemahan Indonesia
│   │   ├── interfaces/
│   │   │   └── base.repository.interface.ts   # IBaseRepository (opsional)
│   │   ├── middlewares/
│   │   │   ├── api-key.middleware.ts          # API key auth
│   │   │   ├── auth.middleware.ts             # JWT auth
│   │   │   ├── language.middleware.ts         # Deteksi Accept-Language
│   │   │   ├── logger.middleware.ts           # Access log + X-Request-Id
│   │   │   ├── optional-json.middleware.ts    # Body JSON opsional
│   │   │   ├── rbac.middleware.ts             # requirePermission / requireRole
│   │   │   └── token-auth.middleware.ts
│   │   └── templates/
│   │       └── email/                 # Template email ({nama}.template.ts)
│   │
│   ├── database/
│   │   ├── migrations/                # 1 entity = 1 migrasi (11 file)
│   │   └── seeders/                   # Seeder RBAC, setting, sample data, user
│   │
│   ├── modules/                       # Feature modules
│   │   ├── auth/                      # Register, login, Google OAuth, reset password
│   │   ├── content/                   # Category, Article & Article View (1 module, 2 domain)
│   │   ├── dashboard/                 # Statistik & trend (read-only, tanpa entity)
│   │   ├── faq/                       # FAQ management
│   │   ├── message/                   # Pesan masuk / contact form
│   │   ├── rbac/                      # Role & Permission management
│   │   ├── setting/                   # Website settings (meta, contact, social media)
│   │   ├── storage/                   # Upload file & proxy object storage (tanpa entity)
│   │   └── user/                      # User management
│   │
│   ├── routes/
│   │   └── api.ts                     # Definisi route
│   │
│   └── index.ts                       # Entry point aplikasi
│
├── test/                              # E2E test (11 file, database terpisah)
├── docs/                              # Dokumentasi lengkap
├── .env                               # Konfigurasi environment (tidak di-commit)
├── .env.dist                          # Template environment
├── AGENTS.md                          # Instruksi untuk AI agent (lintas-tool)
├── CLAUDE.md                          # Instruksi untuk Claude Code (sinkron AGENTS.md)
├── ecosystem.config.js                # Konfigurasi PM2
├── docker-compose.yaml                # Docker Compose setup
├── Dockerfile                         # Docker build
├── swagger.yaml                       # OpenAPI 3.0 spec
└── package.json
```

> Catatan: module `content` memakai subfolder `controllers/` dan `services/` karena menangani dua domain (Category & Article) — pengecualian yang disengaja. Module `storage` dan `dashboard` tidak punya entity/repository sendiri.

## Memulai

### Prasyarat

- [Bun](https://bun.sh) >= 1.0
- MySQL >= 8.0
- SMTP server (untuk fitur email)

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash
```

### Instalasi

```bash
# 1. Clone repository
git clone <repository-url>
cd hono-be

# 2. Install dependencies
bun install

# 3. Salin dan isi environment file
cp .env.dist .env
```

Edit `.env` sesuai konfigurasi lokal Anda (lihat [Konfigurasi Environment](#konfigurasi-environment)).

### Menjalankan Aplikasi

```bash
# Development (hot-reload)
bun run dev

# Production
bun run build
bun run start
```

Server berjalan di `http://localhost:4000` (sesuai nilai `PORT` di `.env`).

### Migrasi & Seeder

```bash
# Jalankan semua migrasi
bun run migration:run

# Lihat status / revert migrasi
bun run migration:show
bun run migration:revert

# Seeder (default Super Admin, Admin, Editor, Author + permissions)
bun run seed

# Seeder spesifik
bun run seed:rbac
bun run seed:users
bun run seed:settings
```

Migrasi tersimpan di `src/database/migrations/` (prinsip 1 entity = 1 migrasi, 11 file berurutan) dan seeder di
`src/database/seeders/`. Detailnya lihat [`docs/DATABASE_GUIDE.md`](docs/DATABASE_GUIDE.md).

### Docker

```bash
docker compose up -d
```

### PM2 (Production Process Manager)

```bash
pm2 start ecosystem.config.js
pm2 logs hono-be
pm2 restart hono-be
```

---

## Konfigurasi Environment

Salin `.env.dist` menjadi `.env` lalu isi setiap nilai:

| Variable               | Deskripsi                                  | Default                 |
| ---------------------- | ------------------------------------------ | ----------------------- |
| `PORT`                 | Port server                                | `4000`                  |
| `ENV`                  | Environment (`development` / `production`) | `development`           |
| `APP_URL`              | Base URL publik server                     | `http://localhost:4000` |
| `DB_TYPE`              | Tipe database (`mysql` / `postgres`)       | `mysql`                 |
| `DB_HOST`              | Host database                              | `localhost`             |
| `DB_PORT`              | Port database                              | `3306`                  |
| `DB_USER`              | Username database                          | `root`                  |
| `DB_PASS`              | Password database                          | —                       |
| `DB_NAME`              | Nama database                              | `amti_be`              |
| `DB_SYNC`              | Auto-sync schema TypeORM (selalu `false` di production) | `false`     |
| `JWT_SECRET`           | Secret untuk access token (15 menit)       | —                       |
| `JWT_REFRESH_SECRET`   | Secret untuk refresh token (7 hari)        | —                       |
| `API_KEY`              | Kunci API server-to-server                 | —                       |
| `SMTP_HOST`            | Host SMTP                                  | —                       |
| `SMTP_PORT`            | Port SMTP                                  | —                       |
| `SMTP_USER`            | Username SMTP                              | —                       |
| `SMTP_PASS`            | Password SMTP                              | —                       |
| `SMTP_FROM`            | Alamat email pengirim                      | —                       |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID                     | —                       |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret                 | —                       |
| `MINIO_ENDPOINT`       | MinIO server endpoint                      | `127.0.0.1`             |
| `MINIO_PORT`           | MinIO server port                          | `9000`                  |
| `MINIO_USE_SSL`        | Gunakan SSL untuk MinIO                    | `false`                 |
| `MINIO_ACCESS_KEY`     | MinIO access key                           | —                       |
| `MINIO_SECRET_KEY`     | MinIO secret key                           | —                       |
| `MINIO_BUCKET`         | MinIO bucket name                          | `hono-be`               |

> **Catatan:** Jangan commit file `.env` ke repository. Pastikan sudah masuk `.gitignore`.
