import { Injectable, type OnModuleInit } from "@nestjs/common";
import { OrderDelivered } from "@ordering";
import { EventBus } from "@core/events/event-bus.js";
import { formatPrice, orderRef } from "../../common/format.js";
import { UserNotifier } from "../../common/user-notifier.js";

/** Acheteur : invitation à laisser un avis. Vendeur : vente terminée. */
@Injectable()
export class OrderDeliveredEmailsListener implements OnModuleInit {
  constructor(
    private readonly events: EventBus,
    private readonly notifier: UserNotifier,
  ) {}

  onModuleInit() {
    this.events.subscribe(OrderDelivered, (event) => this.handle(event));
  }

  async handle(event: OrderDelivered): Promise<void> {
    const ref = orderRef(event.orderId);
    await Promise.all([
      this.notifier.notify(
        event.buyerId,
        `Comment s'est passée la commande ${ref} ?`,
        (name) => `Salut ${name},\n\nTu as bien reçu ton vélo. Laisse une note au vendeur (de 1 à 5) pour aider les prochains acheteurs.`,
      ),
      this.notifier.notify(
        event.sellerId,
        `Vente terminée : commande ${ref}`,
        (name) =>
          `Salut ${name},\n\n${event.automatic ? "La livraison est confirmée d'office (14 jours après l'expédition)" : "L'acheteur a confirmé la réception"}. ` +
          `Vente finalisée pour ${formatPrice(event.totalCents)}.`,
      ),
    ]);
  }
}
