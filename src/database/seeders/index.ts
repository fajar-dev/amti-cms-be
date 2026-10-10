import "reflect-metadata"
import { AppDataSource } from "../../config/database"
import { seedRbac } from "./rbac.seeder"
import { seedUsers } from "./user.seeder"
import { seedSettings } from "./setting.seeder"
import { seedSampleData } from "./sample-data.seeder"

async function runAllSeeders() {
    console.log("=== Starting Database Seeders ===")
    const ds = await AppDataSource.initialize()
    console.log("Database connection established.\n")

    try {
        await seedRbac(ds)
        await seedUsers(ds)
        await seedSettings(ds)
        await seedSampleData(ds)
        console.log("=== All seeders executed successfully! ===")
    } catch (error) {
        console.error("Seeder execution failed:", error)
        process.exitCode = 1
    } finally {
        await ds.destroy()
        console.log("Database connection closed.")
    }
}

runAllSeeders()
