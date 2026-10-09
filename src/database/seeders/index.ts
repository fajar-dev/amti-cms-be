import "reflect-metadata"
import { AppDataSource } from "../../config/database"
import { seedRbac } from "./rbac.seeder"
import { seedUsers } from "./user.seeder"

async function runAllSeeders() {
    console.log("=== Starting Database Seeders ===")
    const ds = await AppDataSource.initialize()
    console.log("Database connection established.\n")

    try {
        await seedRbac(ds)
        await seedUsers(ds)
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
