import { Client } from "../entities/client.entity"
import { resolveStorageUrl } from "../../../core/helpers/storage-url"

export class ClientSerializer {
    static async single(client: Client) {
        let logoUrl: string | null = client.logo
        if (client.logo && !client.logo.startsWith("/")) {
            logoUrl = await resolveStorageUrl(client.logo, { passthroughAbsolute: true, fallbackToPath: true })
        }

        return {
            id: client.id,
            name: client.name,
            logo: client.logo,
            logoUrl: logoUrl || client.logo,
            website: client.website ?? null,
            order: Number(client.order ?? 0),
            isActive: Boolean(client.isActive),
            createdAt: client.createdAt,
            updatedAt: client.updatedAt,
        }
    }

    static async collection(clients: Client[]) {
        return Promise.all(clients.map((c) => this.single(c)))
    }
}
