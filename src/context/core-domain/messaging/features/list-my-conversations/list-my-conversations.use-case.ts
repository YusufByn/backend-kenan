import { Injectable } from "@nestjs/common";
import { UserQueries } from "@identity";
import type { Page, PageRequest } from "@core/http/pagination.js";
import type { ParticipantRole } from "../../domain/conversation.js";
import { ConversationRepository } from "../../domain/conversation.repository.js";
import { previewOf } from "../../domain/message-preview.js";

export type ConversationListItem = {
  id: string;
  listing: { id: string; title: string };
  /** Mon rôle dans la conversation : "buyer" si je suis intéressé, "seller" si c'est mon annonce. */
  myRole: ParticipantRole;
  otherParticipant: { id: string; name: string | null };
  lastMessage: { preview: string; sentAt: Date; fromMe: boolean } | null;
  unreadCount: number;
};

/** Ma boîte de réception : la conversation la plus récemment active d'abord, avec aperçu et non-lus. */
@Injectable()
export class ListMyConversationsUseCase {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly users: UserQueries,
  ) {}

  async execute(userId: string, page: PageRequest): Promise<Page<ConversationListItem>> {
    const { items, total } = await this.conversations.findByParticipant(userId, page);
    const ids = items.map((conversation) => conversation.id);
    // Trois requêtes pour toute la page, quel que soit le nombre de conversations.
    const [lastMessages, unread] = await Promise.all([
      this.conversations.findLastMessages(ids),
      this.conversations.countUnreadByConversation(userId, ids),
    ]);
    const otherIds = [...new Set(items.map((conversation) => conversation.otherParticipant(userId)))];
    const others = new Map(await Promise.all(otherIds.map(async (id) => [id, await this.users.findById(id)] as const)));

    const views = items.map((conversation) => {
      const { id, listingId, listingTitle } = conversation.toPrimitives();
      const otherId = conversation.otherParticipant(userId);
      const last = lastMessages.get(id)?.toPrimitives();
      return {
        id,
        listing: { id: listingId, title: listingTitle },
        myRole: conversation.roleOf(userId),
        otherParticipant: { id: otherId, name: others.get(otherId)?.name ?? null },
        lastMessage: last ? { preview: previewOf(last.body), sentAt: last.sentAt, fromMe: last.senderId === userId } : null,
        unreadCount: unread.get(id) ?? 0,
      };
    });
    return { items: views, page: page.page, limit: page.limit, total };
  }
}
