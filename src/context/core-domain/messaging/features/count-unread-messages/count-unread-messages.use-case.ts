import { Injectable } from "@nestjs/common";
import { ConversationRepository } from "../../domain/conversation.repository.js";

/** Le badge de la messagerie : nombre de messages reçus pas encore lus. Une seule requête SQL. */
@Injectable()
export class CountUnreadMessagesUseCase {
  constructor(private readonly conversations: ConversationRepository) {}

  async execute(userId: string): Promise<{ unread: number }> {
    return { unread: await this.conversations.countUnread(userId) };
  }
}
