# Hono BE — Project Instructions for Gemini

Kamu adalah AI agent yang bekerja pada proyek **AMTI CMS Backend** (`amti-cms-be`):
**Hono + Bun + TypeORM** dengan arsitektur **Clean Architecture**.

> ⚠️ **File ini sengaja dibuat SINGKAT dan tidak memuat aturan proyek.**
> Sebelumnya file ini menyalin isi `CLAUDE.md`, lalu menyimpang jauh darinya
> (masih menyebut modul `contact` yang sudah dihapus, tabel test lama, dsb).
> Agar tidak terulang: **selalu baca sumber kanonik di bawah, jangan tambahkan
> salinan aturan di file ini.**

## Wajib dibaca sebelum menulis kode

| Urutan | File | Isi |
|--------|------|-----|
| 1 | `AGENTS.md` | Ringkasan aturan kritis (tech stack, arsitektur, 10 aturan mutlak, checklist module, konvensi penamaan) — **format lintas-tool, isinya identik dengan `CLAUDE.md`** |
| 2 | `docs/AI_AGENT_RULES.md` | Aturan lengkap untuk AI agent + anti-pattern |
| 3 | `docs/CODING_STANDARDS.md` | Konvensi kode (naming, style, import, comment) |
| 4 | `docs/MODULE_GUIDE.md` | Langkah membuat module baru |
| 5 | `docs/DATABASE_GUIDE.md` | Entity, repository, migrasi, query pattern |
| 6 | `docs/TESTING_GUIDE.md` | Panduan test E2E (`DB_TYPE=mysql bun test`) |
| 7 | `docs/CHANGELOG.md` | Riwayat perubahan terbaru |

Dokumentasi lain ada di folder `docs/`.

## Ringkasan paling singkat

- Alur: `routes/api.ts` → `{module}.module.ts` (wiring DI) → Controller → Service → Repository (via interface)
- Jangan: query DB di controller, format response sendiri, akses `process.env` di luar `config.ts`,
  `c.req.json()` di controller, `throw new Error()` generik, `console.log`, atau expose data sensitif tanpa serializer
- Response selalu lewat `ApiResponse`; error selalu lewat custom exception di `src/core/exceptions/base.ts`
- Setiap perubahan wajib disertai test E2E dan update `swagger.yaml` + `docs/CHANGELOG.md`
- Jalankan `DB_TYPE=mysql bun test` sampai semua (154) test pass
