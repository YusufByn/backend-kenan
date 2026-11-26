import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { EventBus } from "@core/events/event-bus.js";
import { ConversationRepository } from "../../domain/conversation.repository.js";
import { Message, type MessagePrimitives } from "../../domain/message.js";
import { previewOf } from "../../domain/message-preview.js";
import { MessageSent } from "../../public/events/message-sent.event.js";

/** Répondre dans une conversation existante (acheteur ou vendeur). */
@Injectable()
export class SendMessageUseCase {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly events: EventBus,
  ) {}

  async execute(senderId: string, conversationId: string, input: { body: string }): Promise<MessagePrimitives> {
    const conversation = await this.conversations.getVisibleTo(conversationId, senderId);
    const message = Message.write({ id: randomUUID(), conversation, senderId, body: input.body, now: new Date() });
    await this.conversations.save(conversation, message);

    const sent = message.toPrimitives();
    this.events.publish(
      new MessageSent(conversation.id, senderId, conversation.otherParticipant(senderId), conversation.listingTitle, previewOf(sent.body)),
    );
    return sent;
  }
}
