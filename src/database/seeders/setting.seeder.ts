import "reflect-metadata"
import { DataSource } from "typeorm"
import { Setting } from "../../modules/setting/entities/setting.entity"
import { AppDataSource } from "../../config/database"
import { logger } from "../../core/helpers/logger"

export async function seedSettings(ds: DataSource) {
    const settingRepo = ds.getRepository(Setting)
    logger.info("Seeding Settings...")

    let setting = await settingRepo.findOne({ where: {} })
    if (!setting) {
        setting = settingRepo.create({
            phone: "+62 812-8745-6669",
            whatsapp: "+62 812-8745-6669",
            email: "amti.solution@gmail.com",
            address: "Jl. Imam Bonjol Blok A2 No.9, RT.002/RW.002, Bojong Jaya, Kec. Karawaci, Kota Tangerang, Banten 15115",
            mapsUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.4912493365014!2d106.6209516!3d-6.198734000000001!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69fec92e1b20a9%3A0x6233077e13d3f880!2sJl.%20Imam%20Bonjol%20Blok%20A2%20No.9%2C%20RT.002%2FRW.002%2C%20Bojong%20Jaya%2C%20Kec.%20Karawaci%2C%20Kota%20Tangerang%2C%20Banten%2015115!5e0!3m2!1sen!2sid!4v1791796115074!5m2!1sen!2sid",
            facebook: "https://facebook.com",
            instagram: "https://www.instagram.com/amtiofficial/",
            tiktok: "https://www.tiktok.com/@amti.solution?lang=id-ID",
            linkedin: "https://linkedin.com/company/asset-monitoring-teknologi-indonesia",
            twitter: "https://x.com",
            youtube: "https://youtube.com",
        })
        await settingRepo.save(setting)
        logger.info("Default settings created")
    } else {
        logger.info("Settings already exist")
    }
    logger.info("Settings seeding complete")
}

if (import.meta.main) {
    AppDataSource.initialize()
        .then(async (ds) => {
            logger.info("Connected to database")
            await seedSettings(ds)
            await ds.destroy()
        })
        .catch((err) => {
            logger.error("Setting seeder failed", { err })
            process.exit(1)
        })
}
