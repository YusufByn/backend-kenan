import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ListingQueries } from "@catalog";
import { EventBus } from "@core/events/event-bus.js";
import { Conversation, type ConversationPrimitives } from "../../domain/conversation.js";
import { ConversationRepository } from "../../domain/conversation.repository.js";
import { Message, type MessagePrimitives } from "../../domain/message.js";
import { previewOf } from "../../domain/message-preview.js";
import { ListingNotOpenForContactError } from "../../domain/messaging.errors.js";
import { MessageSent } from "../../public/events/message-sent.event.js";

/**
 * "Contacter le vendeur" depuis une annonce. S'il existe déjà une conversation entre cet acheteur
 * et ce vendeur pour cette annonce, le message y est ajouté : jamais deux fils pour le même vélo.
 */
@Injectable()
export class StartConversationUseCase {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly listings: ListingQueries,
    private readonly events: EventBus,
  ) {}

  async execute(
    buyerId: string,
    input: { listingId: string; message: string },
  ): Promise<{ conversation: ConversationPrimitives; message: MessagePrimitives }> {
    const now = new Date();
    let conversation = await this.conversations.findByListingAndBuyer(input.listingId, buyerId);

    if (!conversation) {
      const [listing] = await this.listings.findByIds([input.listingId]);
      // Seulement une annonce en vente : pas un brouillon, ni une annonce vendue ou retirée.
      if (!listing || !listing.available) throw new ListingNotOpenForContactError();
      conversation = Conversation.start({ id: randomUUID(), listing, buyerId, now });
    }

    const message = Message.write({ id: randomUUID(), conversation, senderId: buyerId, body: input.message, now });
    await this.conversations.save(conversation, message);

    const sent = message.toPrimitives();
    this.events.publish(
      new MessageSent(conversation.id, buyerId, conversation.otherParticipant(buyerId), conversation.listingTitle, previewOf(sent.body)),
    );
    return { conversation: conversation.toPrimitives(), message: sent };
  }
}
