import { TypeOrmFaqRepository } from "./repositories/faq.repository"
import { FaqService } from "./faq.service"
import { FaqController } from "./faq.controller"

const faqRepository = new TypeOrmFaqRepository()
const faqService = new FaqService(faqRepository)

export const faqController = new FaqController(faqService)
