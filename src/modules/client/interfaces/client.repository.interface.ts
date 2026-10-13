import { Client } from "../entities/client.entity"
import { SortOrder } from "../../../core/interfaces/base.repository.interface"

export interface ClientListFilters {
    isActive?: boolean
}

export interface IClientRepository {
    findAll(
        page: number,
        limit: number,
        q?: string,
        filters?: ClientListFilters,
        sortBy?: string,
        order?: SortOrder
    ): Promise<{ data: Client[]; total: number }>
    findById(id: number): Promise<Client | null>
    save(data: Partial<Client>): Promise<Client>
    merge(entity: Client, data: Partial<Client>): Client
    delete(id: number): Promise<void>
}
