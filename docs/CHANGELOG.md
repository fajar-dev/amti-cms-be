# 📝 Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — 2026-10-08

### Added
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
