import { Faq } from "../entities/faq.entity"

export class FaqSerializer {
    static single(faq: Faq) {
        return {
            id: faq.id,
            question: faq.question,
            answer: faq.answer,
            order: Number(faq.order ?? 0),
            isActive: Boolean(faq.isActive),
            createdAt: faq.createdAt,
            updatedAt: faq.updatedAt,
        }
    }

    static collection(faqs: Faq[]) {
        return faqs.map((f) => this.single(f))
    }
}
