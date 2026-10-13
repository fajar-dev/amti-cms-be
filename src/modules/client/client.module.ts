import { TypeOrmClientRepository } from "./repositories/client.repository"
import { ClientService } from "./client.service"
import { ClientController } from "./client.controller"

const clientRepository = new TypeOrmClientRepository()
const clientService = new ClientService(clientRepository)

export const clientController = new ClientController(clientService)
