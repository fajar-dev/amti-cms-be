import { minio } from "./minio"

/**
 * Opsi resolusi path object storage.
 *
 * Serializer lama punya tiga perilaku berbeda; opsi ini membuat tiap call site
 * tetap menghasilkan output yang sama seperti sebelumnya.
 */
export interface ResolveStorageUrlOptions {
    /** Kembalikan nilai apa adanya kalau sudah berupa URL absolut (http/https). */
    passthroughAbsolute?: boolean
    /** Kembalikan path asli kalau presign gagal (mis. MinIO tidak terjangkau). */
    fallbackToPath?: boolean
}

/**
 * Mengubah path object storage (MinIO) menjadi URL yang bisa dipakai client.
 *
 * @param path - Object key relatif (mis. "users/avatar.png") atau URL absolut
 * @param options - Lihat ResolveStorageUrlOptions
 */
export async function resolveStorageUrl(
    path: string | null | undefined,
    options: ResolveStorageUrlOptions = {}
): Promise<string | null> {
    const { passthroughAbsolute = false, fallbackToPath = false } = options

    if (!path) return null

    if (passthroughAbsolute && (path.startsWith("http://") || path.startsWith("https://"))) {
        return path
    }

    try {
        return await minio.getPresignedUrl(path)
    } catch (error) {
        if (fallbackToPath) return path
        throw error
    }
}
