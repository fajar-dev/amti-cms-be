import "reflect-metadata"
import { DataSource } from "typeorm"
import { AppDataSource } from "../../config/database"
import { User } from "../../modules/user/entities/user.entity"
import { Role } from "../../modules/rbac/entities/role.entity"
import { hashPassword } from "../../core/helpers/hash"

interface SeedUserData {
    name: string
    email: string
    password: string
    isActive: boolean
    roleName: string
}

const seedUsersList: SeedUserData[] = [
    {
        name: "Super Admin",
        email: "admin@example.com",
        password: "password",
        isActive: true,
        roleName: "Super Admin",
    },
    {
        name: "John Doe",
        email: "john@example.com",
        password: "password",
        isActive: true,
        roleName: "Editor",
    },
    {
        name: "Jane Smith",
        email: "jane@example.com",
        password: "password",
        isActive: true,
        roleName: "Author",
    },
]

export async function seedUsers(ds: DataSource) {
    const userRepo = ds.getRepository(User)
    const roleRepo = ds.getRepository(Role)

    console.log("Seeding users...")

    for (const item of seedUsersList) {
        const role = await roleRepo.findOne({ where: { name: item.roleName } })
        let user = await userRepo.findOne({ where: { email: item.email } })

        const hashedPassword = await hashPassword(item.password)

        if (!user) {
            user = userRepo.create({
                name: item.name,
                email: item.email,
                password: hashedPassword,
                isActive: item.isActive,
                roleId: role ? role.id : null,
            })
            await userRepo.save(user)
            console.log(`  + User created: ${user.email} (Role: ${item.roleName})`)
        } else {
            user.name = item.name
            user.isActive = item.isActive
            user.roleId = role ? role.id : null
            await userRepo.save(user)
            console.log(`  ~ User updated: ${user.email} (Role: ${item.roleName})`)
        }
    }

    console.log("User seeding complete.\n")
}

// Standalone execution
if (import.meta.main) {
    AppDataSource.initialize()
        .then(async (ds) => {
            console.log("Connected to database")
            await seedUsers(ds)
            await ds.destroy()
        })
        .catch((err) => {
            console.error("User seeder failed:", err)
            process.exit(1)
        })
}
