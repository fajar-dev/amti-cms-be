import { ISettingRepository } from "./interfaces/setting.repository.interface"
import { UpdateSettingValidator } from "./validators/setting.validator"
import { minio } from "../../core/helpers/minio"
import { Setting } from "./entities/setting.entity"

export class SettingService {
    constructor(private readonly repository: ISettingRepository) {}

    async getSettings(): Promise<Setting> {
        return await this.repository.get()
    }

    async updateSettings(data: UpdateSettingValidator): Promise<Setting> {
        const payload: Partial<Setting> = { ...data }

        if (data.logo !== undefined) {
            payload.logo = data.logo ? (minio.sanitizePath(data.logo) ?? data.logo) : null
        }
        if (data.favicon !== undefined) {
            payload.favicon = data.favicon ? (minio.sanitizePath(data.favicon) ?? data.favicon) : null
        }
        if (data.ogImage !== undefined) {
            payload.ogImage = data.ogImage ? (minio.sanitizePath(data.ogImage) ?? data.ogImage) : null
        }

        return await this.repository.update(payload)
    }
}
