import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "../../modules/user/entities/user.entity"
import { hashPassword } from "../../core/helpers/hash"
import { config } from "../../config/config"

const dataSource = new DataSource({
    type: config.database.type,
    host: config.database.host,
    port: config.database.port,
    username: config.database.user,
    password: config.database.pass,
    database: config.database.name,
    synchronize: false,
    entities: [User],
})

const users: Partial<User>[] = [
    {
        name: "Super Admin",
        email: "admin@example.com",
        password: "password",
        isActive: true,
    },
    {
        name: "John Doe",
        email: "john@example.com",
        password: "password",
        isActive: true,
    },
    {
        name: "Jane Smith",
        email: "jane@example.com",
        password: "password",
        isActive: true,
    },
]

async function seed() {
    await dataSource.initialize()
    console.log("Database connected")

    const repo = dataSource.getRepository(User)

    let inserted = 0
    let skipped = 0

    for (const data of users) {
        const exists = await repo.findOne({ where: { email: data.email } })
        if (exists) {
            console.log(`Skipped (already exists): ${data.email}`)
            skipped++
            continue
        }

        const hashed = await hashPassword(data.password!)
        await repo.save(repo.create({ ...data, password: hashed }))
        console.log(`Seeded: ${data.email}`)
        inserted++
    }

    console.log(`\nDone! ${inserted} inserted, ${skipped} skipped.`)
    await dataSource.destroy()
}

seed().catch((err) => {
    console.error("Seeder failed:", err)
    process.exit(1)
})
