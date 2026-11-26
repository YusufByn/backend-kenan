import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, type Repository } from "typeorm";
import { isUniqueViolation } from "@core/database/is-unique-violation.js";
import { offsetOf, type PageRequest } from "@core/http/pagination.js";
import { Conversation } from "../domain/conversation.js";
import { ConversationRepository } from "../domain/conversation.repository.js";
import { Message } from "../domain/message.js";
import { ConversationOrmEntity, MessageOrmEntity } from "./conversation.orm-entity.js";

/**
 * "Non lu pour :userId" : message de l'autre participant, envoyé après la dernière lecture de :userId.
 * Les dates sont stockées par TypeORM dans le même format texte trié (YYYY-MM-DD HH:MM:SS.SSS) : la comparaison SQL est juste.
 */
const UNREAD_CONDITION = `m.senderId != :userId AND (
  (c.buyerId = :userId AND (c.buyerLastReadAt IS NULL OR m.sentAt > c.buyerLastReadAt)) OR
  (c.sellerId = :userId AND (c.sellerLastReadAt IS NULL OR m.sentAt > c.sellerLastReadAt))
)`;

@Injectable()
export class TypeOrmConversationRepository extends ConversationRepository {
  constructor(
    @InjectRepository(ConversationOrmEntity)
    private readonly conversations: Repository<ConversationOrmEntity>,
    @InjectRepository(MessageOrmEntity)
    private readonly messages: Repository<MessageOrmEntity>,
  ) {
    super();
  }

  async findById(id: string): Promise<Conversation | null> {
    const row = await this.conversations.findOneBy({ id });
    return row ? Conversation.restore(row) : null;
  }

  async findByListingAndBuyer(listingId: string, buyerId: string): Promise<Conversation | null> {
    const row = await this.conversations.findOneBy({ listingId, buyerId });
    return row ? Conversation.restore(row) : null;
  }

  async findByParticipant(userId: string, page: PageRequest): Promise<{ items: Conversation[]; total: number }> {
    const [rows, total] = await this.conversations.findAndCount({
      where: [{ buyerId: userId }, { sellerId: userId }],
      order: { lastMessageAt: "DESC", id: "ASC" },
      skip: offsetOf(page),
      take: page.limit,
    });
    return { items: rows.map((row) => Conversation.restore(row)), total };
  }

  async findMessages(conversationId: string, page: PageRequest): Promise<{ items: Message[]; total: number }> {
    const [rows, total] = await this.messages.findAndCount({
      where: { conversationId },
      order: { sentAt: "DESC", id: "DESC" },
      skip: offsetOf(page),
      take: page.limit,
    });
    return { items: rows.reverse().map((row) => Message.restore(row)), total };
  }

  async findLastMessages(conversationIds: string[]): Promise<Map<string, Message>> {
    if (conversationIds.length === 0) return new Map();
    // Le message le plus récent de chaque conversation, en une requête.
    const rows = await this.messages
      .createQueryBuilder("m")
      .where("m.conversationId IN (:...ids)", { ids: conversationIds })
      .andWhere("m.sentAt = (SELECT MAX(m2.sentAt) FROM messages m2 WHERE m2.conversationId = m.conversationId)")
      .getMany();
    return new Map(rows.map((row) => [row.conversationId, Message.restore(row)]));
  }

  async countUnreadByConversation(userId: string, conversationIds: string[]): Promise<Map<string, number>> {
    if (conversationIds.length === 0) return new Map();
    const rows: { conversationId: string; count: number }[] = await this.messages
      .createQueryBuilder("m")
      .innerJoin(ConversationOrmEntity, "c", "c.id = m.conversationId")
      .select("m.conversationId", "conversationId")
      .addSelect("COUNT(*)", "count")
      .where("m.conversationId IN (:...ids)", { ids: conversationIds })
      .andWhere(UNREAD_CONDITION, { userId })
      .groupBy("m.conversationId")
      .getRawMany();
    return new Map(rows.map((row) => [row.conversationId, Number(row.count)]));
  }

  async countUnread(userId: string): Promise<number> {
    return this.messages
      .createQueryBuilder("m")
      .innerJoin(ConversationOrmEntity, "c", "c.id = m.conversationId")
      .where(UNREAD_CONDITION, { userId })
      .getCount();
  }

  async save(conversation: Conversation, newMessage?: Message): Promise<void> {
    try {
      await this.conversations.manager.transaction(async (manager) => {
        await manager.save(ConversationOrmEntity, conversation.toPrimitives());
        if (newMessage) await manager.insert(MessageOrmEntity, newMessage.toPrimitives());
      });
    } catch (error) {
      // Deux "premier message" simultanés sur la même annonce : l'index unique (listingId, buyerId) tranche,
      // on rejoue sur la conversation créée par l'autre requête.
      if (isUniqueViolation(error) && newMessage) {
        const { listingId, buyerId } = conversation.toPrimitives();
        const existing = await this.findByListingAndBuyer(listingId, buyerId);
        if (existing) {
          const { senderId, sentAt } = newMessage.toPrimitives();
          const message = Message.restore({
            ...newMessage.toPrimitives(),
            conversationId: existing.id,
            sentAt: existing.recordMessage(senderId, sentAt),
          });
          return this.save(existing, message);
        }
      }
      throw error;
    }
  }
}
