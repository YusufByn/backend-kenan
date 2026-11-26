import { Injectable } from "@nestjs/common";
import type { Page, PageRequest } from "@core/http/pagination.js";
import { ConversationRepository } from "../../domain/conversation.repository.js";
import type { MessagePrimitives } from "../../domain/message.js";

export type MessageView = MessagePrimitives & { fromMe: boolean };

/** Ouvrir une conversation : ses messages (page 1 = les plus récents), et elle passe en "lue". */
@Injectable()
export class ListConversationMessagesUseCase {
  constructor(private readonly conversations: ConversationRepository) {}

  async execute(userId: string, conversationId: string, page: PageRequest): Promise<Page<MessageView>> {
    const conversation = await this.conversations.getVisibleTo(conversationId, userId);
    const { items, total } = await this.conversations.findMessages(conversation.id, page);

    conversation.markReadBy(userId);
    await this.conversations.save(conversation);

    const views = items.map((message) => {
      const primitives = message.toPrimitives();
      return { ...primitives, fromMe: primitives.senderId === userId };
    });
    return { items: views, page: page.page, limit: page.limit, total };
  }
}
