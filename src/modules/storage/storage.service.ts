import crypto from "crypto"
import { BadRequestException } from "../../core/exceptions/base"
import { minio } from "../../core/helpers/minio"

/**
 * Prefix object key untuk seluruh upload.
 * Dipertahankan "users/" demi kompatibilitas path yang sudah tersimpan di database.
 */
const OBJECT_PREFIX = "users"

export class StorageService {
    /**
     * Upload file dari multipart form ke object storage.
     * @returns Object key relatif yang disimpan di database
     */
    async upload(file: unknown): Promise<{ path: string }> {
        if (!file || !(file instanceof File)) {
            throw new BadRequestException("No file uploaded or invalid file")
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const extension = file.name.split(".").pop() || "jpg"
        const objectName = `${OBJECT_PREFIX}/${crypto.randomUUID()}.${extension}`

        await minio.upload(objectName, buffer, file.type)

        return { path: objectName }
    }

    /**
     * Stream object dari storage melalui backend (menghindari akses langsung ke MinIO).
     */
    async proxy(path?: string): Promise<Response> {
        if (!path) {
            throw new BadRequestException("Missing 'path' query parameter")
        }

        return await minio.proxyHandler(path)
    }
}
