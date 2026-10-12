import { EntityManager } from "typeorm"
import { User } from "../entities/user.entity"
import { IBaseRepository, SortOrder } from "../../../core/interfaces/base.repository.interface"

export interface UserListFilters {
    isActive?: string
}

/** Baris ringkas hasil `findAllList` (select manual, bukan entity penuh). */
export interface UserListRow {
    id: number
    name: string
    photo: string | null
    email: string | null
    isActive: boolean
}

export interface IUserRepository extends IBaseRepository<User> {
    findAll(page: number, limit: number, q: string, filters?: UserListFilters, sortBy?: string, order?: SortOrder): Promise<{ data: User[]; total: number }>
    findAllList(isActiveOnly?: boolean): Promise<UserListRow[]>
    findByEmail(email: string): Promise<User | null>
    findByEmailWithPassword(email: string): Promise<User | null>
    findByIdWithPassword(id: number): Promise<User | null>
    saveInTransaction(data: Partial<User>): Promise<User>
}
