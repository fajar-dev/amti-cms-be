import { Client } from "./entities/client.entity"
import { NotFoundException } from "../../core/exceptions/base"
import { IClientRepository, ClientListFilters } from "./interfaces/client.repository.interface"
import { SortOrder } from "../../core/interfaces/base.repository.interface"

export class ClientService {
    constructor(private readonly repository: IClientRepository) {}

    async getAll(
        page: number,
        limit: number,
        q: string = "",
        filters: ClientListFilters = {},
        sortBy?: string,
        order?: SortOrder
    ): Promise<{ data: Client[]; total: number }> {
        return await this.repository.findAll(page, limit, q, filters, sortBy, order)
    }

    async getById(id: number): Promise<Client> {
        const client = await this.repository.findById(id)
        if (!client) {
            throw new NotFoundException("Client not found")
        }
        return client
    }

    async create(data: Partial<Client>): Promise<Client> {
        return await this.repository.save(data)
    }

    async update(id: number, data: Partial<Client>): Promise<Client> {
        const client = await this.getById(id)
        this.repository.merge(client, data)
        return await this.repository.save(client)
    }

    async delete(id: number): Promise<void> {
        await this.getById(id)
        await this.repository.delete(id)
    }
}
