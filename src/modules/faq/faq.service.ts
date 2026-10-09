import { Faq } from "./entities/faq.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { IFaqRepository, FaqListFilters } from "./interfaces/faq.repository.interface"
import { SortOrder } from "../../core/interfaces/base.repository.interface"

export class FaqService {
    constructor(private readonly repository: IFaqRepository) {}

    async getAll(
        page: number,
        limit: number,
        q: string = "",
        filters: FaqListFilters = {},
        sortBy?: string,
        order?: SortOrder
    ): Promise<{ data: Faq[]; total: number }> {
        return await this.repository.findAll(page, limit, q, filters, sortBy, order)
    }

    async getById(id: number): Promise<Faq> {
        const faq = await this.repository.findById(id)
        if (!faq) {
            throw new NotFoundException("FAQ not found")
        }
        return faq
    }

    async create(data: Partial<Faq>): Promise<Faq> {
        return await this.repository.save(data)
    }

    async update(id: number, data: Partial<Faq>): Promise<Faq> {
        const faq = await this.getById(id)
        this.repository.merge(faq, data)
        return await this.repository.save(faq)
    }

    async delete(id: number): Promise<void> {
        await this.getById(id)
        await this.repository.delete(id)
    }
}
