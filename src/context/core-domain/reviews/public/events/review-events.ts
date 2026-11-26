import { DomainEvent } from "@core/events/domain-event.js";

/** Un acheteur a noté un vendeur. notifications prévient le vendeur. */
export class ReviewCreated extends DomainEvent {
  constructor(
    readonly reviewId: string,
    readonly sellerId: string,
    readonly buyerId: string,
    readonly rating: number,
  ) {
    super();
  }
}

/** Le vendeur a répondu à un avis. notifications prévient l'acheteur. */
export class ReviewReplied extends DomainEvent {
  constructor(
    readonly reviewId: string,
    readonly sellerId: string,
    readonly buyerId: string,
  ) {
    super();
  }
}
