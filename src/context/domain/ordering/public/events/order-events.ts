import { DomainEvent } from "@core/events/domain-event.js";
import type { OrderPrimitives } from "../../domain/order.entity.js";

/**
 * Base des événements d'une commande : une photo de la commande au moment du fait,
 * pour que les listeners n'aient pas à relire la commande.
 */
export abstract class OrderEvent extends DomainEvent {
  readonly orderId: string;
  readonly buyerId: string;
  readonly sellerId: string;
  readonly totalCents: number;
  readonly itemTitles: string[];

  constructor(order: OrderPrimitives) {
    super();
    this.orderId = order.id;
    this.buyerId = order.buyerId;
    this.sellerId = order.sellerId;
    this.totalCents = order.totalCents;
    this.itemTitles = order.lines.map((line) => line.title);
  }
}

/** Commande créée au checkout (une par vendeur), en attente de paiement. */
export class OrderPlaced extends OrderEvent {}

export class OrderPaid extends OrderEvent {}

export class OrderShipped extends OrderEvent {
  readonly trackingNumber: string;

  constructor(order: OrderPrimitives) {
    super(order);
    this.trackingNumber = order.trackingNumber ?? "";
  }
}

/** L'acheteur a confirmé la réception : la vente est terminée. */
export class OrderDelivered extends OrderEvent {}

export class OrderCancelled extends OrderEvent {
  constructor(
    order: OrderPrimitives,
    /** Id de l'acheteur ou du vendeur, selon qui a annulé. */
    readonly cancelledBy: string,
  ) {
    super(order);
  }
}
