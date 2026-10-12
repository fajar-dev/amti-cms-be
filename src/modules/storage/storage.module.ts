import { StorageService } from "./storage.service"
import { StorageController } from "./storage.controller"

const storageService = new StorageService()

export const storageController = new StorageController(storageService)
