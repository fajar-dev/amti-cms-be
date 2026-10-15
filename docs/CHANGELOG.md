# 📝 Changelog

## 2026-10-14 — Static website SEO

- Breaking API change: remove PUT /settings/meta and settings.meta permissions from the seed catalog. Settings responses and updates now contain only contact/social fields; legacy metadata inputs are stripped. Existing database columns are retained to avoid data loss, but are no longer exposed or editable.

## 2026-10-13 — Live chat architecture and regression audit

- Remove compiler-confirmed unused imports in auth, content, user and dashboard tests.
- Separate chat enums, TypeORM repository implementations and module composition root. Preserve existing uppercase database/API enum values to avoid an unrequested data migration.
- Store session mutations and their messages atomically in repository transactions with row locking; make repeat claim/resolve/close idempotent and reject competing claims or writes to closed sessions.
- Validate visitor sessions before uploads; enforce action-specific staff permissions and validated ticket pagination/IDs.
- Return the latest 200 messages in chronological order; serialize the assigned user's photo correctly.
- Add live-chat message translations and regression tests (service and database E2E).
- Constrain the optional JSON middleware schema to object output, preserving its existing fallback behavior.

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — 2026-10-13

### Added
- Modul Manajemen Klien & Mitra (`src/modules/client/`):
  - Entity `Client` (`id`, `name`, `logo`, `website`, `order`, `isActive`, `createdAt`, `updatedAt`).
  - Migration database `CreateClientsTable` (`1791364316013-CreateClientsTable.ts`).
  - Repository & Service dengan filtering (`isActive`, pencarian `q` pada nama dan website), sorting, dan paginasi.
  - Serializer `ClientSerializer` mendukung MinIO presigned URL serta static asset path passthrough.
  - Endpoint publik `GET /api/clients` dan `GET /api/clients/public` (hanya klien aktif diurutkan berdasarkan `order`).
  - Endpoint terproteksi RBAC: `GET /api/client`, `GET /api/client/:id`, `POST /api/client`, `PUT /api/client/:id`, `DELETE /api/client/:id`.
  - Permission RBAC baru: `clients.view`, `clients.create`, `clients.update`, `clients.delete` ditambahkan ke `rbac.seeder.ts`.
  - 12 unit & integration test di `test/client.test.ts`.
  - Dokumentasi OpenAPI lengkap di `swagger.yaml`.

---

## [Unreleased] — 2026-10-12 (website publik)

### Added
- Endpoint publik `GET /api/articles` untuk website publik (tanpa autentikasi). Status artikel
  **dipaksa `publish` di service layer** (`ArticleService.getPublished()`), jadi draft tidak mungkin
  bocor walau client mengirim parameter `status`. Mendukung paginasi, pencarian (`q`), filter
  `categoryId`, serta `sortBy`/`order`.
- `ArticleSerializer.publicCard()` / `publicCollection()` — bentuk ringkas artikel untuk daftar di
  website: `content` (isi HTML penuh) sengaja tidak disertakan agar payload daftar tetap kecil.
  Isi lengkap tetap tersedia lewat endpoint publik yang sudah ada, `GET /content/articles/slug/:slug`.
- 6 test E2E baru di `test/content.test.ts`: akses tanpa token, hanya artikel publish yang tampil,
  filter `status` dari query diabaikan, `content` tidak ikut terkirim, pencarian + filter kategori,
  dan paginasi.
- Dokumentasi OpenAPI untuk `/articles` + skema `PublicArticleCard` + tag `Public Website` di
  `swagger.yaml`.

---

## [Unreleased] — 2026-10-12

### Added
- Helper bersama di `src/core/helpers/`: `slug.ts` (`slugify()` untuk generasi slug artikel & kategori), `storage-url.ts` (`resolveStorageUrl()` dengan opsi `passthroughAbsolute` dan `fallbackToPath` untuk presigned URL object storage), dan `client-ip.ts` (`resolveClientIp()` dengan opsi `fallbackToSocket` untuk resolusi IP client di belakang proxy).
- Middleware `optionalJsonBody()` di `src/core/middlewares/optional-json.middleware.ts` — memvalidasi body JSON yang boleh kosong/rusak (dianggap `{}`) lalu mendaftarkannya via `c.req.addValidatedData("json", ...)`.
- Exception `InternalServerException` (500) di `src/core/exceptions/base.ts` untuk error tak terduga / kegagalan dependency eksternal.
- Module `storage` (`src/modules/storage/`: `storage.service.ts`, `storage.controller.ts`, `storage.module.ts`) — memindahkan handler upload & proxy yang sebelumnya inline di `src/routes/api.ts` ke layer service/controller. Module ini tidak punya entity/repository.

### Changed
- Seluruh serializer yang menampilkan cover/avatar/file kini memakai helper bersama `resolveStorageUrl()` alih-alih logika presigned URL masing-masing.
- Service update (`ArticleService`, `CategoryService`, `FaqService`, `MessageService`, `UserService`) memakai `repository.merge()` untuk update, menggantikan penyalinan field manual.
- Referensi kolom TypeORM diseragamkan memakai **nama property entity** (`camelCase`) alih-alih nama kolom database (`snake_case`) — termasuk whitelist `SORTABLE_COLUMNS` di repository.
- `dashboard.serializer.ts` di-rename menjadi `dashboard.serialize.ts` agar konsisten dengan pola `{nama}.serialize.ts`.
- Seluruh seeder (`src/database/seeders/`) memakai `logger` (output JSON) alih-alih `console.log`.
- Standarisasi style: double quotes, indentasi 4 spasi, tanpa semicolon, dan urutan import yang konsisten di seluruh `src/`.
- Tipe `any` di repository, service, dan serializer diganti tipe riil. Sisa `any` hanya di batas framework (`exceptions/base.ts`, `helpers/response.ts`, `helpers/validator.ts`, `helpers/auth.ts`).
- Service tidak lagi mengembalikan `true` yang tidak bermakna; method yang hanya melakukan aksi kini bertipe `Promise<void>`.
- `role.validator.ts` mengekspor tipe hasil `z.infer` (`CreateRoleValidator`, `UpdateRoleValidator`) agar controller dan service tidak menduplikasi definisi tipe.

### Fixed
- `POST /api/content/articles/:id/view` kini memakai `c.req.valid()` di controller (bukan `c.req.json()`), sehingga Zod validation tetap berjalan — namun tetap toleran terhadap body kosong lewat `optionalJsonBody()`.
- `GET /api/proxy` tanpa parameter `path` kini mengembalikan response dengan format `ApiResponse` standar (sebelumnya format ad-hoc).
- `src/core/helpers/mail.ts` tidak lagi melempar `Error` generik (kini `InternalServerException`) dan tidak lagi membocorkan detail SMTP ke response client — detail teknis hanya masuk log.

### Removed
- Folder placeholder `src/jobs/` yang tidak terpakai.

---

## [Unreleased] — 2026-10-08

### Added
- Fitur dan modul RBAC (Role-Based Access Control) lengkap:
  - Entitas `Role` dan `Permission` di `src/modules/rbac/entities/` dengan relasi many-to-many via junction table `role_permissions`.
  - Kolom `role_id` pada entitas `User` dengan relasi many-to-one ke `Role`.
  - Penyederhanaan skema `Role`: penghapusan `is_system` dan `display_name`. Pengenal peran menggunakan `id` numerik dan kolom tunggal `name` untuk nama peran.
  - Repositori dan interface `TypeOrmRoleRepository` dan `TypeOrmPermissionRepository` di `src/modules/rbac/`.
  - Service `RbacService` dan controller `RbacController` untuk CRUD roles, daftar permission flat & grouped by module, dan proteksi integritas relasional pengguna.
  - Validator Zod di `src/modules/rbac/validators/role.validator.ts`: `CreateRoleValidator` dan `UpdateRoleValidator` (validasi nama peran tunggal).
  - Middleware otorisasi `requirePermission` dan `requireRole` di `src/core/middlewares/rbac.middleware.ts` dengan bypass untuk role ID 1 / Super Admin, multi-permission check, dan penolakan akses user tanpa role.
  - Integrasi `requirePermission` pada seluruh endpoint User, Content (Categories & Articles), FAQ, dan RBAC di `src/routes/api.ts`.
  - Perbaikan `authMiddleware`: pemanggilan `await next()` di luar blok `try/catch` token verification agar error 403 Forbidden dari middleware otorisasi tidak tertimpa menjadi 401 Unauthorized.
  - Struktur seeder database: `src/database/seeders/rbac.seeder.ts` (seeding 20 permissions & 4 roles default: Super Admin, Admin, Editor, Author), `src/database/seeders/user.seeder.ts` (binding user ke peran Super Admin, Editor, Author), dan master seeder `src/database/seeders/index.ts` dengan script `bun run seed`.
  - Reorganisasi seluruh migrasi database dengan prinsip 1 entity 1 migration berurutan: `CreateRolesTable` (1791364316001), `CreatePermissionsTable` (1791364316002), `CreateRolePermissionsTable` (1791364316003), `CreateUsersTable` (1791364316004), `CreatePasswordResetTokensTable` (1791364316005), `CreateCategoriesTable` (1791364316006), `CreateArticlesTable` (1791364316007), `CreateArticleViewsTable` (1791364316008), dan `CreateFaqsTable` (1791364316009).
  - Serializer `RoleSerializer` dan `PermissionSerializer`, integrasi `role` pada `UserSerializer` dan `AuthSerializer`, serta penambahan daftar pengguna (`users`) pada respons peran untuk mendukung avatar grup pengguna.
  - Rute API RBAC di `/api/rbac/roles`, `/api/rbac/roles/all`, `/api/rbac/roles/:id`, dan `/api/rbac/permissions`.
  - OpenAPI Swagger specification dan i18n localization (en & id) untuk modul RBAC.
  - Test suite komprehensif di `test/rbac.test.ts` (12 test cases).
- Modul FAQ (`faq`) yang mencakup CRUD lengkap untuk pengelolaan Tanya Jawab (Frequently Asked Questions).
- Entitas TypeORM di `src/modules/faq/entities/faq.entity.ts`: `Faq` dengan kolom `question`, `answer`, `order`, `isActive`, `createdAt`, dan `updatedAt`.
- Repositori dan interface di `src/modules/faq/repositories/` dan `interfaces/` untuk FAQ dengan pencarian (`q`), filter status aktif, serta sorting dinamis.
- Service `FaqService` dan Controller `FaqController` dengan endpoint index paginated, show by id, store, update, dan destroy.
- Validator Zod di `src/modules/faq/validators/faq.validator.ts`: `CreateFaqValidator` dan `UpdateFaqValidator`.
- Serializer `FaqSerializer` di `src/modules/faq/serializers/faq.serialize.ts`.
- Composition root wiring di `src/modules/faq/faq.module.ts`.
- Migrasi database `1791364316005-CreateFaqsTable.ts` yang kompatibel dengan PostgreSQL dan MySQL.
- Rute API terdaftar di `src/routes/api.ts` di bawah `/faq`.
- Test suite komprehensif di `test/faq.test.ts` (CRUD, validasi input, filtering status aktif, dan pagination).
- Spesifikasi OpenAPI Swagger lengkap di `swagger.yaml` untuk endpoint dan skema FAQ (`Faq`, `CreateFaqRequest`, `UpdateFaqRequest`).
- Modul Konten (`content`) yang mencakup manajemen Kategori (`Category`), Artikel (`Article`), dan Metrik Pembaca (`ArticleView`).
- Entitas TypeORM di `src/modules/content/entities/`: `Category`, `Article`, dan `ArticleView`.
- Enum `ArticleStatus` (`draft`, `publish`) di `src/modules/content/enum/article-status.enum.ts`.
- Repositori dan interface di `src/modules/content/repositories/` dan `interfaces/` untuk Article, Category, dan ArticleView.
- Service `CategoryService` dan `ArticleService` dengan fitur auto-slug generation, pencegahan slug duplikat, tags JSON, SEO meta fields (canonical URL, OpenGraph), dan integrasi cover MinIO.
- Controller `CategoryController` dan `ArticleController` dengan endpoint CRUD, unpaginated category list, public slug lookup, public view tracker (`recordView`), dan audit riwayat kunjungan (`views`).
- Serializer `CategorySerializer`, `ArticleSerializer` (dengan resolusi cover presigned URL), dan `ArticleViewSerializer`.
- Validator Zod di `src/modules/content/validators/`: `CreateCategoryValidator`, `UpdateCategoryValidator`, `CreateArticleValidator`, `UpdateArticleValidator`, dan `RecordViewValidator`.
- Composition root wiring di `src/modules/content/content.module.ts`.
- Migrasi database `1791364316004-CreateContentTables.ts` yang kompatibel dengan PostgreSQL dan MySQL.
- Rute API terdaftar di `src/routes/api.ts` di bawah `/content/categories` dan `/content/articles`.
- Data factory `createCategoryData` dan `createArticleData` di `test/helpers.ts`.
- Suite E2E test komprehensif di `test/content.test.ts` (kategori, artikel, slug, SEO, views tracking).
- Spesifikasi OpenAPI Swagger lengkap di `swagger.yaml` untuk seluruh skema dan endpoint konten.
- Terjemahan pesan i18n untuk konten di `src/core/i18n/en.json` dan `src/core/i18n/id.json`.
- Entitas `PasswordResetToken` di `src/modules/auth/entities/password-reset-token.entity.ts` untuk tabel `password_reset_tokens`.
- Interface `IPasswordResetTokenRepository` di `src/modules/auth/interfaces/password-reset-token.repository.interface.ts` dan implementasi TypeORM di `src/modules/auth/repositories/password-reset-token.repository.ts`.
- Migrasi database `1791364316003-CreatePasswordResetTokensTable.ts` untuk PostgreSQL dan MySQL dengan index pada kolom `email` dan `token`.
- Dukungan multi-token reset password: pengguna dapat me-request reset password beberapa kali dengan token terpisah yang valid secara simultan.
- Integration test komprehensif di `test/auth.test.ts` untuk validasi token, kedaluwarsa token, multi-token, dan penghapusan seluruh token untuk email terkait setelah reset berhasil.
- Template email HTML responsif untuk forgot password di `src/core/templates/email/forgot-password.template.ts` lengkap dengan fallback teks biasa, anti-XSS escaping, CTA button, dan callout masa kedaluwarsa token.
- Unit test untuk template email di `test/email.test.ts`.
- Endpoint `GET /api/user/list` untuk mendapatkan daftar ringkas pengguna (unpaginated) untuk keperluan dropdown / form select.
- Relasi `author` (`User`) pada entitas `Article` (`author_id` foreign key ke `users(id)`), termasuk index `IDX_articles_author_id`, serialisasi author (id, name, email, photo), dan opsi sorting berdasarkan author.
- Kolom `description` pada entitas `Article` sebagai ringkasan artikel.
- Test case untuk `GET /api/user/list` di `test/user.test.ts`.

### Changed
- Migrasi awal tabel users (`1791364316001-CreateUsersTable.ts`) diset ulang sehingga sejak awal tidak memiliki kolom `reset_password_token` dan `reset_password_expires`.
- `AuthService` kini menggunakan `IPasswordResetTokenRepository` untuk mengelola token reset password secara terpisah dari tabel `users`.
- Ketika salah satu token berhasil digunakan untuk me-reset password, seluruh token reset password yang terkait dengan email tersebut langsung dihapus secara atomik (`deleteByEmail`).
- Menghapus kolom dan logika legacy `resetPasswordToken` / `resetPasswordExpires` dari entitas `User`, repository `User`, dan service `User`.
- `AuthService.forgotPassword()` kini mengirim email HTML via `mail.sendHtml()` menggunakan template baru, menggantikan plain text sederhana.
- Penataan ulang migrasi: `1791364316004-CreateContentTables.ts` dikonsolidasikan langsung membuat tabel `articles` dengan kolom `author_id` dan `description` tanpa kolom SEO, serta menghapus file migrasi patch (`1791364316005-AddAuthorIdToArticlesTable.ts` dan `1791364316006-RemoveSeoFieldsFromArticlesTable.ts`).
- Konfigurasi default database beralih ke MySQL (`DB_TYPE=mysql`, default port `3306`).
- Nama database diubah menjadi `amti_be` (test database: `amti_be_test`).
- Update `.env`, `.env.dist`, `src/config/config.ts`, `docker-compose.yaml`, `swagger.yaml`, dan seluruh dokumentasi terkait.

### Removed
- Seluruh fitur, modul, dan rute terkait Contact (`src/modules/contact/`, rute `/api/contact`, tabel `contacts`, migrasi `1791364316002-CreateContactsTable.ts`, test suite, dan spesifikasi OpenAPI Swagger).
- Seluruh kolom dan fitur SEO pada artikel (`meta_title`, `meta_description`, `meta_keywords`, `canonical_url`, `og_title`, `og_description`, `og_image`) dari validator, entitas, serializer, migrasi, dan OpenAPI Swagger.

---

## [0.1.0] — 2026-06-18

### Added
- Initial release

---

## Template Entri Baru

```markdown
## [X.Y.Z] — YYYY-MM-DD

### Added
- Fitur baru

### Changed
- Perubahan pada fitur yang sudah ada

### Deprecated
- Fitur yang akan dihapus di versi mendatang

### Removed
- Fitur yang dihapus

### Fixed
- Perbaikan bug

### Security
- Perbaikan keamanan
```

### Versioning Rules

- **MAJOR** (X.0.0): Breaking changes, perubahan arsitektur besar
- **MINOR** (0.X.0): Fitur baru, module baru, penambahan endpoint
- **PATCH** (0.0.X): Bug fix, perbaikan kecil, update dependencies
