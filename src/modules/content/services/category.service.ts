import { Category } from "../entities/category.entity"
import { ICategoryRepository } from "../interfaces/category.repository.interface"
import { NotFoundException, BadRequestException } from "../../../core/exceptions/base"
import { SortOrder } from "../../../core/interfaces/base.repository.interface"

function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/[\s\W-]+/g, "-")
        .replace(/^-+|-+$/g, "")
}

export class CategoryService {
    constructor(private readonly repository: ICategoryRepository) {}

    async getAll(
        page: number,
        limit: number,
        q: string = "",
        sortBy?: string,
        order?: SortOrder
    ): Promise<{ data: Category[]; total: number }> {
        return await this.repository.findAll(page, limit, q, sortBy, order)
    }

    async getAllList(): Promise<Category[]> {
        return await this.repository.findAllList()
    }

    async getById(id: number): Promise<Category> {
        const category = await this.repository.findById(id)
        if (!category) {
            throw new NotFoundException("Category not found")
        }
        return category
    }

    async create(data: { name: string; slug?: string; description?: string | null }): Promise<Category> {
        const slug = slugify(data.slug || data.name)
        if (!slug) {
            throw new BadRequestException("Invalid category name or slug")
        }

        const existingSlug = await this.repository.findBySlug(slug)
        if (existingSlug) {
            throw new BadRequestException("Category slug already in use")
        }

        return await this.repository.save({
            name: data.name,
            slug,
            description: data.description ?? null,
        })
    }

    async update(id: number, data: { name?: string; slug?: string; description?: string | null }): Promise<Category> {
        const category = await this.getById(id)

        if (data.name !== undefined) {
            category.name = data.name
        }

        if (data.slug !== undefined || (data.name && !data.slug)) {
            const newSlug = slugify(data.slug || data.name || category.name)
            if (newSlug !== category.slug) {
                const existingSlug = await this.repository.findBySlug(newSlug)
                if (existingSlug && existingSlug.id !== id) {
                    throw new BadRequestException("Category slug already in use")
                }
                category.slug = newSlug
            }
        }

        if (data.description !== undefined) {
            category.description = data.description ?? null
        }

        return await this.repository.save(category)
    }

    async delete(id: number): Promise<void> {
        await this.getById(id)
        await this.repository.delete(id)
    }
}
