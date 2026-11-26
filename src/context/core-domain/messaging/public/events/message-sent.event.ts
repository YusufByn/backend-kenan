import { DomainEvent } from "@core/events/domain-event.js";

/** Un message vient d'être envoyé. notifications prévient le destinataire par email. */
export class MessageSent extends DomainEvent {
  constructor(
    readonly conversationId: string,
    readonly senderId: string,
    readonly recipientId: string,
    readonly listingTitle: string,
    /** Début du message, pour l'aperçu dans l'email. */
    readonly preview: string,
  ) {
    super();
  }
}
