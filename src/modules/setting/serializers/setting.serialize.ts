import { Setting } from "../entities/setting.entity"
import { minio } from "../../../core/helpers/minio"

export class SettingSerializer {
    private static async resolveUrl(path?: string | null): Promise<string | null> {
        if (!path) return null
        if (path.startsWith("http://") || path.startsWith("https://")) return path
        try {
            return await minio.getPresignedUrl(path)
        } catch {
            return path
        }
    }

    static async single(setting: Setting) {
        return {
            id: setting.id,
            siteName: setting.siteName,
            siteDescription: setting.siteDescription ?? null,
            metaKeywords: setting.metaKeywords ?? null,
            author: setting.author ?? null,
            copyright: setting.copyright ?? null,
            logo: setting.logo ?? null,
            logoUrl: await this.resolveUrl(setting.logo),
            favicon: setting.favicon ?? null,
            faviconUrl: await this.resolveUrl(setting.favicon),
            ogImage: setting.ogImage ?? null,
            ogImageUrl: await this.resolveUrl(setting.ogImage),
            phone: setting.phone ?? null,
            email: setting.email ?? null,
            address: setting.address ?? null,
            facebook: setting.facebook ?? null,
            instagram: setting.instagram ?? null,
            tiktok: setting.tiktok ?? null,
            linkedin: setting.linkedin ?? null,
            twitter: setting.twitter ?? null,
            youtube: setting.youtube ?? null,
            createdAt: setting.createdAt,
            updatedAt: setting.updatedAt,
        }
    }
}
