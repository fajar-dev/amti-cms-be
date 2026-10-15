import { TypeOrmChatSessionRepository } from "./repositories/chat-session.repository"
import { TypeOrmChatMessageRepository } from "./repositories/chat-message.repository"
import { LiveChatService } from "./livechat.service"
import { LiveChatController } from "./livechat.controller"

const sessionRepository = new TypeOrmChatSessionRepository()
const messageRepository = new TypeOrmChatMessageRepository()
const liveChatService = new LiveChatService(sessionRepository, messageRepository)

export const livechatController = new LiveChatController(liveChatService)
