import { DomainEvent } from "@core/events/domain-event.js";
import type { OrderPrimitives } from "../../domain/order.js";

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

/** Réception confirmée, par l'acheteur ou d'office 14 jours après l'expédition : la vente est terminée. */
export class OrderDelivered extends OrderEvent {
  constructor(
    order: OrderPrimitives,
    /** true si confirmée d'office par la tâche planifiée. */
    readonly automatic = false,
  ) {
    super(order);
  }
}

/** Pourquoi une commande est annulée : le message envoyé n'est pas le même. */
export type CancellationReason = "cancelled_by_user" | "account_suspended";

export class OrderCancelled extends OrderEvent {
  constructor(
    order: OrderPrimitives,
    /** Id de l'acheteur ou du vendeur : celui qui a annulé, ou dont le compte a été suspendu. */
    readonly cancelledBy: string,
    readonly reason: CancellationReason = "cancelled_by_user",
  ) {
    super(order);
  }
}

/** Pas payée avant sa date limite : annulée d'office par la tâche planifiée, les vélos sont remis en vente. */
export class OrderExpired extends OrderEvent {}
