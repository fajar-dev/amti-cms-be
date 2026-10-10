import { TypeOrmDashboardRepository } from "./repositories/dashboard.repository"
import { DashboardService } from "./dashboard.service"
import { DashboardController } from "./dashboard.controller"

const dashboardRepository = new TypeOrmDashboardRepository()
const dashboardService = new DashboardService(dashboardRepository)

export const dashboardController = new DashboardController(dashboardService)
