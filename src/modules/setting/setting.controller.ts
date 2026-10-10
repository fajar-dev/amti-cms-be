import { Context } from "hono"
import { SettingService } from "./setting.service"
import { SettingSerializer } from "./serializers/setting.serialize"
import { ApiResponse } from "../../core/helpers/response"

export class SettingController {
    constructor(private readonly service: SettingService) {}

    async show(c: Context) {
        const setting = await this.service.getSettings()
        const serialized = await SettingSerializer.single(setting)
        return ApiResponse.success(c, serialized, "Settings retrieved successfully")
    }

    async update(c: Context) {
        const body = c.req.valid("json" as never)
        const updated = await this.service.updateSettings(body)
        const serialized = await SettingSerializer.single(updated)
        return ApiResponse.success(c, serialized, "Settings updated successfully")
    }

    async updateMeta(c: Context) {
        const body = c.req.valid("json" as never)
        const updated = await this.service.updateSettings(body)
        const serialized = await SettingSerializer.single(updated)
        return ApiResponse.success(c, serialized, "Website meta settings updated successfully")
    }

    async updateContact(c: Context) {
        const body = c.req.valid("json" as never)
        const updated = await this.service.updateSettings(body)
        const serialized = await SettingSerializer.single(updated)
        return ApiResponse.success(c, serialized, "Contact settings updated successfully")
    }

    async updateSocial(c: Context) {
        const body = c.req.valid("json" as never)
        const updated = await this.service.updateSettings(body)
        const serialized = await SettingSerializer.single(updated)
        return ApiResponse.success(c, serialized, "Social media settings updated successfully")
    }

    async getPublic(c: Context) {
        const setting = await this.service.getSettings()
        const serialized = await SettingSerializer.single(setting)
        return ApiResponse.success(c, serialized, "Public settings retrieved successfully")
    }
}
