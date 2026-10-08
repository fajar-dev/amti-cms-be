# 📝 Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased] — 2026-10-08

### Added
- Entitas `PasswordResetToken` di `src/modules/auth/entities/password-reset-token.entity.ts` untuk tabel `password_reset_tokens`.
- Interface `IPasswordResetTokenRepository` di `src/modules/auth/interfaces/password-reset-token.repository.interface.ts` dan implementasi TypeORM di `src/modules/auth/repositories/password-reset-token.repository.ts`.
- Migrasi database `1791364316003-CreatePasswordResetTokensTable.ts` untuk PostgreSQL dan MySQL dengan index pada kolom `email` dan `token`.
- Dukungan multi-token reset password: pengguna dapat me-request reset password beberapa kali dengan token terpisah yang valid secara simultan.
- Integration test komprehensif di `test/auth.test.ts` untuk validasi token, kedaluwarsa token, multi-token, dan penghapusan seluruh token untuk email terkait setelah reset berhasil.
- Template email HTML responsif untuk forgot password di `src/core/templates/email/forgot-password.template.ts` lengkap dengan fallback teks biasa, anti-XSS escaping, CTA button, dan callout masa kedaluwarsa token.
- Unit test untuk template email di `test/email.test.ts`.

### Changed
- Migrasi awal tabel users (`1791364316001-CreateUsersTable.ts`) diset ulang sehingga sejak awal tidak memiliki kolom `reset_password_token` dan `reset_password_expires`.
- `AuthService` kini menggunakan `IPasswordResetTokenRepository` untuk mengelola token reset password secara terpisah dari tabel `users`.
- Ketika salah satu token berhasil digunakan untuk me-reset password, seluruh token reset password yang terkait dengan email tersebut langsung dihapus secara atomik (`deleteByEmail`).
- Menghapus kolom dan logika legacy `resetPasswordToken` / `resetPasswordExpires` dari entitas `User`, repository `User`, dan service `User`.
- `AuthService.forgotPassword()` kini mengirim email HTML via `mail.sendHtml()` menggunakan template baru, menggantikan plain text sederhana.
- Konfigurasi default database beralih ke MySQL (`DB_TYPE=mysql`, default port `3306`).
- Nama database diubah menjadi `amti_be` (test database: `amti_be_test`).
- Update `.env`, `.env.dist`, `src/config/config.ts`, `docker-compose.yaml`, dan seluruh dokumentasi terkait.

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
