import { TypeOrmMessageRepository } from "./repositories/message.repository"
import { MessageService } from "./message.service"
import { MessageController } from "./message.controller"

const messageRepository = new TypeOrmMessageRepository()
const messageService = new MessageService(messageRepository)

export const messageController = new MessageController(messageService)
