import type { PageRequest } from "@core/http/pagination.js";
import type { Conversation } from "./conversation.js";
import type { Message } from "./message.js";
import { ConversationNotFoundError } from "./messaging.errors.js";

/** Port : stockage des conversations et de leurs messages (un seul agrégat, une seule transaction). */
export abstract class ConversationRepository {
  abstract findById(id: string): Promise<Conversation | null>;
  abstract findByListingAndBuyer(listingId: string, buyerId: string): Promise<Conversation | null>;
  /** Conversations où le user est acheteur ou vendeur, la plus récemment active d'abord. */
  abstract findByParticipant(userId: string, page: PageRequest): Promise<{ items: Conversation[]; total: number }>;
  /** Page 1 = les messages les plus récents ; dans une page, du plus ancien au plus récent (ordre de lecture). */
  abstract findMessages(conversationId: string, page: PageRequest): Promise<{ items: Message[]; total: number }>;
  /** Dernier message de chaque conversation, pour l'aperçu dans la liste. */
  abstract findLastMessages(conversationIds: string[]): Promise<Map<string, Message>>;
  /** Messages reçus pas encore lus, par conversation. */
  abstract countUnreadByConversation(userId: string, conversationIds: string[]): Promise<Map<string, number>>;
  /** Total des messages reçus non lus, toutes conversations confondues (badge de la messagerie). */
  abstract countUnread(userId: string): Promise<number>;
  /** Enregistre la conversation, et le nouveau message s'il y en a un, dans la même transaction. */
  abstract save(conversation: Conversation, newMessage?: Message): Promise<void>;

  async getVisibleTo(id: string, userId: string): Promise<Conversation> {
    const conversation = await this.findById(id);
    if (!conversation || !conversation.isParticipant(userId)) throw new ConversationNotFoundError(id);
    return conversation;
  }
}
