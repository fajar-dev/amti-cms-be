import { TypeOrmSettingRepository } from "./repositories/setting.repository"
import { SettingService } from "./setting.service"
import { SettingController } from "./setting.controller"

const settingRepository = new TypeOrmSettingRepository()
export const settingService = new SettingService(settingRepository)
export const settingController = new SettingController(settingService)
