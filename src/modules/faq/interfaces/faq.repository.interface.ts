import { Faq } from "../entities/faq.entity"
import { IBaseRepository, SortOrder } from "../../../core/interfaces/base.repository.interface"

export interface FaqListFilters {
    category?: string
    isActive?: boolean
}

export interface IFaqRepository extends IBaseRepository<Faq> {
    findAll(
        page: number,
        limit: number,
        q?: string,
        filters?: FaqListFilters,
        sortBy?: string,
        order?: SortOrder
    ): Promise<{ data: Faq[]; total: number }>
}
