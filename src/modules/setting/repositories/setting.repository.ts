import { Repository } from "typeorm"
import { AppDataSource } from "../../../config/database"
import { Setting } from "../entities/setting.entity"
import { ISettingRepository } from "../interfaces/setting.repository.interface"

export class TypeOrmSettingRepository implements ISettingRepository {
    private readonly repository: Repository<Setting>

    constructor() {
        this.repository = AppDataSource.getRepository(Setting)
    }

    async get(): Promise<Setting> {
        let setting = await this.repository.findOne({ where: {} })
        if (!setting) {
            setting = this.repository.create({
                siteName: "AMTI",
                siteDescription: "AMTI Content Management System",
                metaKeywords: "amti, cms, content management",
                author: "AMTI Team",
                copyright: `© ${new Date().getFullYear()} AMTI. All rights reserved.`,
            })
            setting = await this.repository.save(setting)
        }
        return setting
    }

    async update(data: Partial<Setting>): Promise<Setting> {
        const setting = await this.get()
        this.repository.merge(setting, data)
        return await this.repository.save(setting)
    }
}
