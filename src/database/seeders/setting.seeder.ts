import "reflect-metadata"
import { DataSource } from "typeorm"
import { Setting } from "../../modules/setting/entities/setting.entity"
import { AppDataSource } from "../../config/database"

export async function seedSettings(ds: DataSource) {
    const settingRepo = ds.getRepository(Setting)
    console.log("Seeding Settings...")

    let setting = await settingRepo.findOne({ where: {} })
    if (!setting) {
        setting = settingRepo.create({
            siteName: "AMTI",
            siteDescription: "AMTI Content Management System",
            metaKeywords: "amti, cms, content management",
            author: "AMTI Team",
            copyright: `© ${new Date().getFullYear()} AMTI. All rights reserved.`,
            phone: "+62 812 3456 7890",
            email: "info@amti.id",
            address: "Jakarta, Indonesia",
            facebook: "https://facebook.com",
            instagram: "https://instagram.com",
            tiktok: "https://tiktok.com",
            linkedin: "https://linkedin.com",
            twitter: "https://x.com",
            youtube: "https://youtube.com",
        })
        await settingRepo.save(setting)
        console.log("  + Default settings created.")
    } else {
        console.log("  ~ Settings already exist.")
    }
    console.log("Settings seeding complete.\n")
}

if (import.meta.main) {
    AppDataSource.initialize()
        .then(async (ds) => {
            console.log("Connected to database")
            await seedSettings(ds)
            await ds.destroy()
        })
        .catch((err) => {
            console.error("Setting seeder failed:", err)
            process.exit(1)
        })
}
