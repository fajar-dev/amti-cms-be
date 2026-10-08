import { Category } from "../entities/category.entity"
import { IBaseRepository, SortOrder } from "../../../core/interfaces/base.repository.interface"

export interface ICategoryRepository extends IBaseRepository<Category> {
    findAll(page: number, limit: number, q?: string, sortBy?: string, order?: SortOrder): Promise<{ data: Category[]; total: number }>
    findAllList(): Promise<Category[]>
    findBySlug(slug: string): Promise<Category | null>
    findByName(name: string): Promise<Category | null>
}
