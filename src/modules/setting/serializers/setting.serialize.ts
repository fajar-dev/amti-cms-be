import { Setting } from "../entities/setting.entity"

export class SettingSerializer {
    static single(setting: Setting) {
        return {
            id: setting.id,
            phone: setting.phone ?? null,
            whatsapp: setting.whatsapp ?? null,
            email: setting.email ?? null,
            address: setting.address ?? null,
            mapsUrl: setting.mapsUrl ?? null,
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
