import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CatalogModule } from "@catalog";
import { IdentityModule } from "@identity";
import { ConversationRepository } from "./domain/conversation.repository.js";
import { CountUnreadMessagesController } from "./features/count-unread-messages/count-unread-messages.controller.js";
import { CountUnreadMessagesUseCase } from "./features/count-unread-messages/count-unread-messages.use-case.js";
import { ListConversationMessagesController } from "./features/list-conversation-messages/list-conversation-messages.controller.js";
import { ListConversationMessagesUseCase } from "./features/list-conversation-messages/list-conversation-messages.use-case.js";
import { ListMyConversationsController } from "./features/list-my-conversations/list-my-conversations.controller.js";
import { ListMyConversationsUseCase } from "./features/list-my-conversations/list-my-conversations.use-case.js";
import { SendMessageController } from "./features/send-message/send-message.controller.js";
import { SendMessageUseCase } from "./features/send-message/send-message.use-case.js";
import { StartConversationController } from "./features/start-conversation/start-conversation.controller.js";
import { StartConversationUseCase } from "./features/start-conversation/start-conversation.use-case.js";
import { ConversationOrmEntity, MessageOrmEntity } from "./infrastructure/conversation.orm-entity.js";
import { TypeOrmConversationRepository } from "./infrastructure/typeorm-conversation.repository.js";

/** Messagerie acheteur / vendeur autour d'une annonce. */
@Module({
  imports: [
    TypeOrmModule.forFeature([ConversationOrmEntity, MessageOrmEntity]),
    IdentityModule, // JwtAuthGuard, RequirePermission("MESSAGE_SEND"), UserQueries (nom de l'autre participant)
    CatalogModule, // ListingQueries : l'annonce existe et est en vente, qui est le vendeur
  ],
  controllers: [
    CountUnreadMessagesController,
    ListMyConversationsController,
    StartConversationController,
    ListConversationMessagesController,
    SendMessageController,
  ],
  providers: [
    CountUnreadMessagesUseCase,
    ListMyConversationsUseCase,
    StartConversationUseCase,
    ListConversationMessagesUseCase,
    SendMessageUseCase,
    { provide: ConversationRepository, useClass: TypeOrmConversationRepository },
  ],
})
export class MessagingModule {}
