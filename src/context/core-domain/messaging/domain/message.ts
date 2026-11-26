import type { Conversation } from "./conversation.js";
import { InvalidMessageError } from "./messaging.errors.js";

export type MessagePrimitives = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  sentAt: Date;
};

const BODY_MAX_LENGTH = 2000;

export class Message {
  private constructor(private readonly props: MessagePrimitives) {}

  /** Seul un participant écrit dans une conversation (sinon 404 via conversation.roleOf). */
  static write(props: { id: string; conversation: Conversation; senderId: string; body: string; now: Date }): Message {
    props.conversation.roleOf(props.senderId);
    const body = props.body.trim();
    if (!body) throw new InvalidMessageError("Le message est vide", "body");
    if (body.length > BODY_MAX_LENGTH) throw new InvalidMessageError(`${BODY_MAX_LENGTH} caractères maximum`, "body");

    const sentAt = props.conversation.recordMessage(props.senderId, props.now);
    return new Message({ id: props.id, conversationId: props.conversation.id, senderId: props.senderId, body, sentAt });
  }

  static restore(props: MessagePrimitives): Message {
    return new Message({ ...props });
  }

  toPrimitives(): MessagePrimitives {
    return { ...this.props };
  }
}
