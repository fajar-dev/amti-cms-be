import { DataSource } from "typeorm"
import { Category } from "../../modules/content/entities/category.entity"
import { Article } from "../../modules/content/entities/article.entity"
import { ArticleView } from "../../modules/content/entities/article-view.entity"
import { Message } from "../../modules/message/entities/message.entity"
import { Faq } from "../../modules/faq/entities/faq.entity"
import { User } from "../../modules/user/entities/user.entity"
import { ArticleStatus } from "../../modules/content/enum/article-status.enum"

export async function seedSampleData(ds: DataSource) {
    const categoryRepo = ds.getRepository(Category)
    const articleRepo = ds.getRepository(Article)
    const viewRepo = ds.getRepository(ArticleView)
    const messageRepo = ds.getRepository(Message)
    const faqRepo = ds.getRepository(Faq)
    const userRepo = ds.getRepository(User)

    console.log("Seeding sample categories, articles, views, and messages...")

    const author = await userRepo.findOne({ where: {} })

    // Categories
    const categoryData = [
        { name: "Teknologi & Inovasi", slug: "teknologi-dan-inovasi", description: "Perkembangan teknologi modern dan transformasi digital" },
        { name: "Bisnis & Industri", slug: "bisnis-dan-industri", description: "Tren industri, manufaktur, dan pasar global" },
        { name: "Edukasi & Riset", slug: "edukasi-dan-riset", description: "Publikasi penelitian, pelatihan, dan pengembangan SDM" },
        { name: "Siaran Pers", slug: "siaran-pers", description: "Berita resmi dan siaran pers organisasi AMTI" },
    ]

    const categories: Category[] = []
    for (const c of categoryData) {
        let cat = await categoryRepo.findOne({ where: { slug: c.slug } })
        if (!cat) {
            cat = await categoryRepo.save(categoryRepo.create(c))
        }
        categories.push(cat)
    }

    // Articles
    const now = new Date()
    const articleData = [
        {
            title: "Pemanfaatan Kecerdasan Buatan dalam Industri Manufaktur Modern",
            slug: "pemanfaatan-kecerdasan-buatan-dalam-industri-manufaktur-modern",
            description: "Bagaimana integrasi teknologi AI merevolusi efisiensi operasional pabrik dan otomatisasi rantai pasok.",
            content: "<p>Industri manufaktur terus berkembang dengan hadirnya otomatisasi berbasis AI...</p>",
            category: categories[0],
            status: ArticleStatus.PUBLISH,
            viewsCount: 342,
            publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        },
        {
            title: "Strategi Penguatan Daya Saing Ekspor Produk Dalam Negeri 2026",
            slug: "strategi-penguatan-daya-saing-ekspor-produk-dalam-negeri-2026",
            description: "Langkah-langkah strategis dalam menembus pasar internasional dengan standar mutu tinggi.",
            content: "<p>Ekspor produk bernilai tambah menjadi kunci pertumbuhan ekonomi nasional...</p>",
            category: categories[1],
            status: ArticleStatus.PUBLISH,
            viewsCount: 215,
            publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
            createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        },
        {
            title: "AMTI Selenggarakan Pelatihan Sertifikasi Tenaga Ahli Nasional",
            slug: "amti-selenggarakan-pelatihan-sertifikasi-tenaga-ahli-nasional",
            description: "Program peningkatan kompetensi teknis untuk praktisi industri di seluruh Indonesia.",
            content: "<p>Dalam rangka mendukung kesiapan tenaga kerja industri masa depan...</p>",
            category: categories[2],
            status: ArticleStatus.PUBLISH,
            viewsCount: 178,
            publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
            createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
        {
            title: "Roadmap Pengembangan Energi Terbarukan untuk Sektor Industri",
            slug: "roadmap-pengembangan-energi-terbarukan-untuk-sektor-industri",
            description: "Panduan transisi energi hijau ramah lingkungan bagi kawasan industri terpadu.",
            content: "<p>Transisi energi bersih semakin mendesak untuk menekan emisi karbon industri...</p>",
            category: categories[0],
            status: ArticleStatus.DRAFT,
            viewsCount: 0,
            publishedAt: null,
            createdAt: new Date(),
        },
        {
            title: "Laporan Tahunan Kinerja dan Capaian Sektor Asosiasi 2025",
            slug: "laporan-tahunan-kinerja-dan-capaian-sektor-asosiasi-2025",
            description: "Rangkuman lengkap pencapaian program kerja dan kolaborasi strategis tahun 2025.",
            content: "<p>Berikut ringkasan capaian positif serta proyeksi agenda kerja tahun mendatang...</p>",
            category: categories[3],
            status: ArticleStatus.PUBLISH,
            viewsCount: 96,
            publishedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
            createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        },
    ]

    const articles: Article[] = []
    for (const a of articleData) {
        let art = await articleRepo.findOne({ where: { slug: a.slug } })
        if (!art) {
            art = await articleRepo.save(
                articleRepo.create({
                    ...a,
                    authorId: author?.id || null,
                    categoryId: a.category?.id || null,
                })
            )
        }
        articles.push(art)
    }

    // Article views distributed over the last 7 days
    if (articles.length > 0 && (await viewRepo.count()) === 0) {
        const viewsDistribution = [15, 28, 45, 32, 60, 52, 70] // past 7 days
        for (let i = 0; i < 7; i++) {
            const count = viewsDistribution[i]
            const dayOffset = 6 - i
            const viewDate = new Date(now.getTime() - dayOffset * 24 * 60 * 60 * 1000)
            const sampleArt = articles[i % articles.length]

            for (let j = 0; j < count; j++) {
                await viewRepo.save(
                    viewRepo.create({
                        articleId: sampleArt.id,
                        ipAddress: `192.168.1.${(j % 50) + 1}`,
                        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                        viewedAt: viewDate,
                    })
                )
            }
        }
    }

    // Messages
    const messageData = [
        {
            name: "Budi Santoso",
            email: "budi.santoso@perusahaan.co.id",
            phone: "+62 811 2345 6789",
            subject: "Permohonan Kerjasama Program Riset Industri",
            message: "Selamat siang tim AMTI, kami dari PT Maju Industri bermaksud mengajukan proposal kolaborasi penelitian otomasi.",
            isRead: false,
            createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
            name: "Siti Rahmawati",
            email: "siti.rahma@univ-teknik.ac.id",
            phone: "+62 812 9876 5432",
            subject: "Undangan Pembicara Seminar Nasional Manufaktur",
            message: "Kepada Yth. Pengurus AMTI, kami mengundang perwakilan asosiasi untuk menjadi keynote speaker pada seminar kami bulan depan.",
            isRead: false,
            createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000), // 6 hours ago
        },
        {
            name: "Hendrik Prasetyo",
            email: "hendrik.p@globallogistics.com",
            phone: "+62 813 4567 8901",
            subject: "Informasi Pendaftaran Keanggotaan Asosiasi",
            message: "Halo, kami ingin mengetahui persyaratan dan biaya keanggotaan perusahaan di asosiasi AMTI untuk tahun ini.",
            isRead: true,
            createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
        },
        {
            name: "Dewi Lestari",
            email: "dewi.lestari@techmedia.id",
            phone: "+62 819 1234 5678",
            subject: "Permintaan Wawancara Terkait Regulasi Baru",
            message: "Rekan jurnalis TechMedia ingin memohon kesediaan wawancara mengenai pandangan AMTI atas regulasi industri terbaru.",
            isRead: true,
            createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        },
        {
            name: "Ahmad Fauzi",
            email: "ahmad.fauzi@solusiteknologi.com",
            phone: "+62 821 7654 3210",
            subject: "Penawaran Solusi Monitoring IoT Pabrik",
            message: "Kami ingin memperkenalkan sistem monitoring berbasis IoT untuk mendukung efisiensi energi industri manufaktur.",
            isRead: false,
            createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        },
    ]

    for (const m of messageData) {
        const existing = await messageRepo.findOne({ where: { email: m.email, subject: m.subject } })
        if (!existing) {
            await messageRepo.save(messageRepo.create(m))
        }
    }

    // FAQs
    const faqData = [
        {
            question: "Apa itu Asosiasi AMTI?",
            answer: "AMTI adalah asosiasi yang menaungi pelaku industri dan praktisi manufaktur teknologi di Indonesia.",
            status: "publish",
        },
        {
            question: "Bagaimana cara mendaftar sebagai anggota AMTI?",
            answer: "Pendaftaran dapat dilakukan melalui portal resmi atau menghubungi sekretariat melalui formulir kontak.",
            status: "publish",
        },
        {
            question: "Apakah tersedia program pelatihan untuk mahasiswa?",
            answer: "Ya, kami menyediakan berbagai program workshop dan magang bersertifikasi bagi mahasiswa perguruan tinggi mitra.",
            status: "publish",
        },
    ]

    for (const f of faqData) {
        const existing = await faqRepo.findOne({ where: { question: f.question } })
        if (!existing) {
            await faqRepo.save(faqRepo.create(f))
        }
    }

    console.log("Sample data seeded successfully!")
}

if (import.meta.main) {
    const { AppDataSource } = await import("../../config/database")
    const ds = await AppDataSource.initialize()
    try {
        await seedSampleData(ds)
    } finally {
        await ds.destroy()
    }
}
