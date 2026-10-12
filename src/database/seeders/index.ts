import "reflect-metadata"
import { AppDataSource } from "../../config/database"
import { logger } from "../../core/helpers/logger"
import { seedRbac } from "./rbac.seeder"
import { seedUsers } from "./user.seeder"
import { seedSettings } from "./setting.seeder"
import { seedSampleData } from "./sample-data.seeder"

async function runAllSeeders() {
    logger.info("=== Starting Database Seeders ===")
    const ds = await AppDataSource.initialize()
    logger.info("Database connection established")

    try {
        await seedRbac(ds)
        await seedUsers(ds)
        await seedSettings(ds)
        await seedSampleData(ds)
        logger.info("=== All seeders executed successfully! ===")
    } catch (error) {
        logger.error("Seeder execution failed", { err: error })
        process.exitCode = 1
    } finally {
        await ds.destroy()
        logger.info("Database connection closed.")
    }
}

runAllSeeders()
