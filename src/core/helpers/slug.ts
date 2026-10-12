/**
 * Slug Helper
 *
 * Mengubah teks bebas menjadi slug yang aman untuk URL.
 * Dipakai bersama oleh ArticleService dan CategoryService.
 */
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, "-")
        .replace(/^-+|-+$/g, "")
}
