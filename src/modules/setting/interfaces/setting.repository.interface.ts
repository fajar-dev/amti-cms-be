import { Setting } from "../entities/setting.entity"

export interface ISettingRepository {
    get(): Promise<Setting>
    update(data: Partial<Setting>): Promise<Setting>
}
