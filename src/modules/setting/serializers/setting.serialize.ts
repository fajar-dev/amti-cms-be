import { Setting } from "../entities/setting.entity"
import { resolveStorageUrl } from "../../../core/helpers/storage-url"

export class SettingSerializer {
    static async single(setting: Setting) {
        return {
            id: setting.id,
            siteName: setting.siteName,
            siteDescription: setting.siteDescription ?? null,
            metaKeywords: setting.metaKeywords ?? null,
            author: setting.author ?? null,
            copyright: setting.copyright ?? null,
            logo: setting.logo ?? null,
            logoUrl: await resolveStorageUrl(setting.logo, { passthroughAbsolute: true, fallbackToPath: true }),
            favicon: setting.favicon ?? null,
            faviconUrl: await resolveStorageUrl(setting.favicon, { passthroughAbsolute: true, fallbackToPath: true }),
            ogImage: setting.ogImage ?? null,
            ogImageUrl: await resolveStorageUrl(setting.ogImage, { passthroughAbsolute: true, fallbackToPath: true }),
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
