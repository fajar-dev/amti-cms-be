import { DashboardService } from "./dashboard.service"
import { DashboardController } from "./dashboard.controller"

const dashboardService = new DashboardService()
export const dashboardController = new DashboardController(dashboardService)
