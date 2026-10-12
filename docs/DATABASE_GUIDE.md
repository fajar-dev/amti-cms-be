# 🗄️ Panduan Database

Dokumen ini menjelaskan standar dan panduan untuk entity, repository, TypeORM, dan manajemen database.

---

## 1. Database yang Didukung

| Database | Driver | Default Port |
|----------|--------|-------------|
| PostgreSQL | `pg` | 5432 |
| MySQL | `mysql2` | 3306 |

Pemilihan database dikonfigurasi via environment variable `DB_TYPE`:

```env
DB_TYPE=postgres   # atau mysql
```

---

## 2. TypeORM Configuration

**File**: `src/config/database.ts`

```typescript
export const AppDataSource = new DataSource({
    type: config.database.type,     // "postgres" | "mysql"
    host: config.database.host,
    port: config.database.port,
    username: config.database.user,
    password: config.database.pass,
    database: config.database.name,
    synchronize: config.database.sync,  // true = auto-sync schema (development saja)
    entities: [User, PasswordResetToken, Category, Article, ArticleView, Faq, Role, Permission, Setting, Message],
    migrations: [__dirname + "/../database/migrations/*{.ts,.js}"],
    subscribers: [],
})
```

### Aturan Penting

- **Selalu daftarkan entity baru** di array `entities`
- `synchronize: true` — gunakan hanya di **development**. Di production, `DB_SYNC` otomatis dipaksa `false`
- Entity diimport langsung (bukan glob pattern)
- **Migrasi sudah diimplementasikan** — lihat §3. Di production gunakan migrasi, bukan `synchronize`
- DataSource bisa di-override saat test lewat `setDataSource()` (lihat `test/setup.ts`)

---

## 3. Migrasi & Seeder

### Migrasi

Semua tabel dibuat lewat migrasi di `src/database/migrations/` dengan prinsip **1 entity = 1 migrasi**,
berurutan sesuai timestamp (1791364316001 s/d 1791364316011):

| Migrasi | Tabel |
|---------|-------|
| `1791364316001-CreateRolesTable.ts` | `roles` |
| `1791364316002-CreatePermissionsTable.ts` | `permissions` |
| `1791364316003-CreateRolePermissionsTable.ts` | `role_permissions` (junction) |
| `1791364316004-CreateUsersTable.ts` | `users` (termasuk FK `role_id`) |
| `1791364316005-CreatePasswordResetTokensTable.ts` | `password_reset_tokens` |
| `1791364316006-CreateCategoriesTable.ts` | `categories` |
| `1791364316007-CreateArticlesTable.ts` | `articles` |
| `1791364316008-CreateArticleViewsTable.ts` | `article_views` |
| `1791364316009-CreateFaqsTable.ts` | `faqs` |
| `1791364316010-CreateSettingsTable.ts` | `settings` |
| `1791364316011-CreateMessagesTable.ts` | `messages` |

Semua migrasi **kompatibel dengan PostgreSQL dan MySQL** (percabangan `isPostgres` di dalam `up()`).

```bash
bun run migration:run       # jalankan migrasi yang belum dieksekusi
bun run migration:show      # lihat status migrasi
bun run migration:revert    # rollback migrasi terakhir
bun run migration:generate  # generate migrasi dari perubahan entity
bun run migration:create    # buat file migrasi kosong
```

> File migrasi **dibiarkan memakai semicolon** (artefak historis) — lihat pengecualian style di `docs/CODING_STANDARDS.md` §9.

### Seeder

Seeder ada di `src/database/seeders/` dan memakai `logger` (output CLI-nya JSON, bukan `console.log`):

```bash
bun run seed            # jalankan semua seeder (index.ts)
bun run seed:rbac       # permissions & roles default
bun run seed:users      # user default
bun run seed:settings   # settings default
```

`sample-data.seeder.ts` (data contoh: category, article, view, message) hanya dipanggil dari master seeder `index.ts`.

---

## 4. Entity Conventions

### Template Entity Standar

```typescript
import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    UpdateDateColumn 
} from "typeorm"

@Entity("table_name_plural")       // snake_case, plural
export class EntityName {           // PascalCase, singular
    @PrimaryGeneratedColumn()
    id!: number

    // ── Required Fields ──
    @Column()
    name!: string

    // ── Optional Fields ──
    @Column({ nullable: true })
    description?: string

    // ── Mapped Column Names ──
    @Column({ name: "is_active", default: true })
    isActive!: boolean

    // ── Sensitive Fields (excluded from SELECT) ──
    @Column({ select: false, nullable: true })
    password?: string

    // ── Typed Columns ──
    @Column({ type: "decimal", precision: 12, scale: 2 })
    amount!: number

    @Column({ type: "timestamp", nullable: true })
    expiresAt?: Date

    // ── Timestamps (WAJIB) ──
    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt!: Date
}
```

### Tipe Kolom Umum

| TypeScript Type | Column Config | Contoh |
|----------------|---------------|--------|
| `string` (required) | `@Column()` | `name!: string` |
| `string` (optional) | `@Column({ nullable: true })` | `photo?: string` |
| `string` (unique) | `@Column({ unique: true })` | `email!: string` |
| `boolean` | `@Column({ default: true })` | `isActive!: boolean` |
| `number` (integer) | `@Column()` | `quantity!: number` |
| `number` (decimal) | `@Column({ type: "decimal", precision: 12, scale: 2 })` | `amount!: number` |
| `Date` (auto) | `@CreateDateColumn({ name: "..." })` | `createdAt!: Date` |
| `Date` (nullable) | `@Column({ type: "timestamp", nullable: true })` | `expiresAt?: Date` |
| `string` (hidden) | `@Column({ select: false })` | `password?: string` |

---

## 5. Repository Pattern

### Interface → Implementation

```
IInvoiceRepository (interface)
    │
    └── TypeOrmInvoiceRepository (implementation)
            │
            └── AppDataSource.getRepository(Invoice)
```

### Standard Repository Methods

| Method | Return Type | Deskripsi |
|--------|------------|-----------|
| `findAll(page, limit, q, sortBy?, order?)` | `Promise<{ data: T[]; total: number }>` | List dengan pagination + sorting (lihat §6) |
| `findById(id)` | `Promise<T \| null>` | Cari by ID |
| `save(data, manager?)` | `Promise<T>` | Simpan (create/update) |
| `merge(entity, data)` | `T` | Merge data partial ke entity |
| `delete(id)` | `Promise<void>` | Hapus by ID |

> **`IBaseRepository<T>` opsional.** 7 repository memakai kontrak dasar ini lewat `extends IBaseRepository<T>`;
> repository read-only/agregat (`IRoleRepository`, `IPermissionRepository`, `ISettingRepository`, `IDashboardRepository`)
> mendeklarasikan method sendiri karena bentuknya memang berbeda.

### Transaction Support

```typescript
// Di service layer:
import { AppDataSource } from "../../config/database"
import { EntityManager } from "typeorm"

await AppDataSource.transaction(async (manager: EntityManager) => {
    await this.service.save(data1, manager)
    await this.otherService.save(data2, manager)
})

// Di repository:
async save(data: Partial<T>, manager?: EntityManager): Promise<T> {
    const repo = manager ? manager.getRepository(Entity) : this.repository
    return await repo.save(data)
}
```

---

## 6. Query Builder Patterns

### Basic Pagination dengan Search dan Sorting

```typescript
import { SortOrder } from "../../core/interfaces/base.repository.interface"

// Whitelist kolom yang boleh di-sort — JANGAN masukkan sortBy langsung ke .orderBy() (SQL injection)
const SORTABLE_COLUMNS: Record<string, string> = {
    name: "alias.name",
    email: "alias.email",
    createdAt: "alias.createdAt",
}

async findAll(page: number, limit: number, q: string, sortBy?: string, order: SortOrder = "DESC") {
    const offset = (page - 1) * limit
    const query = this.repository.createQueryBuilder("alias")

    if (q) {
        query.where(
            "(alias.name LIKE :q OR alias.email LIKE :q)",
            { q: `%${q}%` }
        )
    }

    const total = await query.getCount()
    const orderColumn = (sortBy && SORTABLE_COLUMNS[sortBy]) || "alias.id"
    const data = await query
        .orderBy(orderColumn, order)
        .skip(offset)
        .take(limit)
        .getMany()

    return { data, total }
}
```

Controller membaca `sortBy`/`order` dari query string:

```typescript
const sortBy = c.req.query("sortBy") || undefined
const order = c.req.query("order")?.toUpperCase() === "ASC" ? "ASC" : "DESC"
```

> Kalau repository pakai `.getRawMany()` (select manual dengan `AS` alias, contoh: `UserRepository`), `SORTABLE_COLUMNS` harus mengarah ke nama kolom SQL asli (`alias.is_active`, `alias.created_at`), bukan nama alias hasil `AS`.

> **Default `order` berbeda antar module dan itu disengaja**: `faq` & `rbac` default `ASC` (konten terkurasi / daftar referensi), sedangkan `article`, `category`, `user`, dan `message` default `DESC` (data terbaru di atas).

### Filter Query

```typescript
if (filters.isActive !== undefined && filters.isActive !== "") {
    query.andWhere("alias.is_active = :isActive", { 
        isActive: filters.isActive === "1" 
    })
}
```

### Custom Select (Raw Query)

```typescript
const query = this.repository.createQueryBuilder("user")
    .select([
        "user.id AS id",
        "user.name AS name",
        "user.is_active AS isActive",
    ])

const data = await query.getRawMany()
```

### Include Hidden Fields

```typescript
// Untuk field dengan { select: false }
const user = await this.repository.createQueryBuilder("user")
    .where("user.email = :email", { email })
    .addSelect("user.password")
    .getOne()
```

### Dynamic Sorting

```typescript
const sortMap: Record<string, string> = {
    name: "alias.name",
    email: "alias.email",
    createdAt: "alias.created_at",
}
const finalSort = sortMap[sort] || "alias.id"
const finalOrder = order.toUpperCase() === "ASC" ? "ASC" : "DESC"

query.orderBy(finalSort, finalOrder)
```

---

## 7. Entity yang Ada

### users (`User`)

| Kolom | Tipe | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | int (PK, auto) | ❌ | auto | |
| `name` | varchar | ❌ | - | |
| `photo` | varchar | ✅ | null | Path object storage (MinIO) |
| `email` | varchar (unique) | ❌ | - | |
| `password` | varchar | ✅ | null | `select: false`, hashed |
| `is_active` | boolean | ❌ | true | |
| `role_id` | int (FK → `roles.id`) | ✅ | null | `ON DELETE SET NULL`, index `IDX_users_role_id` |
| `created_at` | timestamp | ❌ | auto | |
| `updated_at` | timestamp | ❌ | auto | |

> Kolom `reset_password_token` / `reset_password_expires` **sudah tidak ada** di tabel `users` —
> token reset password dipindah ke tabel `password_reset_tokens` (mendukung multi-token simultan).

### password_reset_tokens (`PasswordResetToken`)

| Kolom | Tipe | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | int (PK, auto) | ❌ | auto | |
| `email` | varchar(255) | ❌ | - | Index |
| `token` | varchar(255) | ❌ | - | Index |
| `expires_at` | timestamp | ❌ | - | |
| `created_at` | timestamp | ❌ | auto | |
| `updated_at` | timestamp | ❌ | auto | |

### roles (`Role`)

| Kolom | Tipe | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | int (PK, auto) | ❌ | auto | |
| `name` | varchar (unique) | ❌ | - | Pengenal peran |
| `description` | varchar | ✅ | null | |
| `created_at` | timestamp | ❌ | auto | |
| `updated_at` | timestamp | ❌ | auto | |

Relasi: `permissions` (`@ManyToMany` → `permissions` via `role_permissions`), `users` (`@OneToMany` dari `User.role`).

### permissions (`Permission`)

| Kolom | Tipe | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | int (PK, auto) | ❌ | auto | |
| `name` | varchar (unique) | ❌ | - | Mis. `users.view` |
| `module` | varchar | ❌ | - | Grup module (mis. `users`) |
| `description` | varchar | ✅ | null | |
| `created_at` | timestamp | ❌ | auto | |
| `updated_at` | timestamp | ❌ | auto | |

### role_permissions (junction)

Tabel pivot `@ManyToMany` dengan `@JoinTable` di `Role` — tidak punya entity class sendiri:

| Kolom | Tipe | Notes |
|-------|------|-------|
| `role_id` | int (FK → `roles.id`) | `joinColumn` |
| `permission_id` | int (FK → `permissions.id`) | `inverseJoinColumn` |

### categories (`Category`)

| Kolom | Tipe | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | int (PK, auto) | ❌ | auto | |
| `name` | varchar(255) | ❌ | - | |
| `slug` | varchar(255, unique) | ❌ | - | Auto-generate via `slugify()` |
| `description` | text | ✅ | null | |
| `created_at` | timestamp | ❌ | auto | |
| `updated_at` | timestamp | ❌ | auto | |

Relasi: `articles` (`@OneToMany` dari `Article.category`).

### articles (`Article`)

| Kolom | Tipe | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | int (PK, auto) | ❌ | auto | |
| `author_id` | int (FK → `users.id`) | ✅ | null | `ON DELETE SET NULL`, index `IDX_articles_author_id` |
| `category_id` | int (FK → `categories.id`) | ✅ | null | `ON DELETE SET NULL`, index |
| `title` | varchar(255) | ❌ | - | |
| `slug` | varchar(255, unique) | ❌ | - | Auto-generate via `slugify()`, anti-duplikat |
| `cover` | varchar(255) | ✅ | null | Path object storage |
| `content` | text | ❌ | - | |
| `tags` | json | ✅ | null | Array string |
| `status` | enum (`draft`, `publish`) | ❌ | `draft` | `ArticleStatus` |
| `description` | text | ✅ | null | Ringkasan artikel |
| `views_count` | int | ❌ | 0 | Counter metrik pembaca |
| `published_at` | timestamp | ✅ | null | Diisi saat pertama kali `publish` |
| `created_at` | timestamp | ❌ | auto | |
| `updated_at` | timestamp | ❌ | auto | |

Relasi: `author` (`@ManyToOne` → `User`), `category` (`@ManyToOne` → `Category`), `views` (`@OneToMany` → `ArticleView`).

### article_views (`ArticleView`)

| Kolom | Tipe | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | int (PK, auto) | ❌ | auto | |
| `article_id` | int (FK → `articles.id`) | ❌ | - | `ON DELETE CASCADE`, index `IDX_article_views_article_id` |
| `ip_address` | varchar(45) | ✅ | null | Resolusi via `resolveClientIp()` |
| `user_agent` | text | ✅ | null | |
| `referrer` | varchar(500) | ✅ | null | |
| `user_id` | int | ✅ | null | Diisi jika request terautentikasi (tanpa FK) |
| `viewed_at` | timestamp | ❌ | auto | `@CreateDateColumn` |

> Tabel ini **tidak** punya `created_at`/`updated_at` — satu-satunya timestamp-nya `viewed_at`.

### faqs (`Faq`)

| Kolom | Tipe | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | int (PK, auto) | ❌ | auto | |
| `question` | varchar(500) | ❌ | - | |
| `answer` | text | ❌ | - | |
| `order` | int | ❌ | 0 | Urutan tampil (default sort `ASC`) |
| `is_active` | boolean | ❌ | true | |
| `created_at` | timestamp | ❌ | auto | |
| `updated_at` | timestamp | ❌ | auto | |

### settings (`Setting`)

Single-row: hanya ada satu baris konfigurasi website.

| Kolom | Tipe | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | int (PK, auto) | ❌ | auto | |
| `site_name` | varchar(255) | ❌ | `"AMTI"` | |
| `site_description` | text | ✅ | null | |
| `meta_keywords` | text | ✅ | null | |
| `author` | varchar(255) | ✅ | null | |
| `copyright` | varchar(255) | ✅ | null | |
| `logo` | varchar(500) | ✅ | null | Path object storage |
| `favicon` | varchar(500) | ✅ | null | Path object storage |
| `og_image` | varchar(500) | ✅ | null | Path object storage |
| `phone` | varchar(50) | ✅ | null | |
| `email` | varchar(255) | ✅ | null | |
| `address` | text | ✅ | null | |
| `facebook` | varchar(500) | ✅ | null | |
| `instagram` | varchar(500) | ✅ | null | |
| `tiktok` | varchar(500) | ✅ | null | |
| `linkedin` | varchar(500) | ✅ | null | |
| `twitter` | varchar(500) | ✅ | null | |
| `youtube` | varchar(500) | ✅ | null | |
| `created_at` | timestamp | ❌ | auto | |
| `updated_at` | timestamp | ❌ | auto | |

### messages (`Message`)

| Kolom | Tipe | Nullable | Default | Notes |
|-------|------|----------|---------|-------|
| `id` | int (PK, auto) | ❌ | auto | |
| `name` | varchar(255) | ❌ | - | |
| `email` | varchar(255) | ❌ | - | |
| `phone` | varchar(50) | ✅ | null | |
| `subject` | varchar(255) | ❌ | - | |
| `message` | text | ❌ | - | |
| `is_read` | boolean | ❌ | false | |
| `created_at` | timestamp | ❌ | auto | |
| `updated_at` | timestamp | ❌ | auto | |

---

## 8. Relasi

Relasi TypeORM **sudah diimplementasikan** dan dipakai di entity, repository, maupun serializer.
Yang tersedia saat ini: `@ManyToOne`, `@OneToMany`, dan `@ManyToMany` dengan `@JoinTable`.

```typescript
// Many-to-One + kolom FK eksplisit (contoh: Article → Category)
@Index()
@Column({ name: "category_id", nullable: true })
categoryId?: number | null

@ManyToOne(() => Category, (category) => category.articles, { onDelete: "SET NULL", nullable: true })
@JoinColumn({ name: "category_id" })
category?: Category | null

// One-to-Many (sisi sebaliknya)
@OneToMany("Article", "category")
articles?: Article[]

// Many-to-Many dengan junction table eksplisit (contoh: Role ↔ Permission)
@ManyToMany(() => Permission, (permission) => permission.roles)
@JoinTable({
    name: "role_permissions",
    joinColumn: { name: "role_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "permission_id", referencedColumnName: "id" },
})
permissions!: Permission[]
```

### Konvensi Relasi

- Foreign key column: `{entity}_id` (snake_case)
- Property FK: `{entity}Id` (camelCase)
- `@JoinColumn` wajib dengan `{ name: "fk_column" }`
- Tentukan `onDelete` secara eksplisit: `CASCADE` (child selalu ikut parent, mis. `article_views`) atau `SET NULL` (relasi opsional, mis. `articles.category_id`)
- Tambahkan `@Index()` pada kolom FK yang sering dipakai untuk filter
- **Tidak** memakai eager loading — relasi dimuat eksplisit via `relations: [...]` atau `leftJoinAndSelect` di repository
