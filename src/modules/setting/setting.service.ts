import { ISettingRepository } from "./interfaces/setting.repository.interface"
import { UpdateSettingValidator } from "./validators/setting.validator"
import { Setting } from "./entities/setting.entity"

export class SettingService {
    constructor(private readonly repository: ISettingRepository) {}

    async getSettings(): Promise<Setting> {
        return await this.repository.get()
    }

    async updateSettings(data: Partial<UpdateSettingValidator>): Promise<Setting> {
        return await this.repository.update(UpdateSettingValidator.parse(data))
    }
}
