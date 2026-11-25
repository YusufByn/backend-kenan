import { Injectable, type OnModuleInit } from "@nestjs/common";
import { OrderPaid } from "@ordering";
import { EventBus } from "@core/events/event-bus.js";
import { formatPrice, itemList, orderRef } from "../../common/format.js";
import { UserNotifier } from "../../common/user-notifier.js";

/** Acheteur : paiement reçu. Vendeur : vélo vendu, à expédier. */
@Injectable()
export class OrderPaidEmailsListener implements OnModuleInit {
  constructor(
    private readonly events: EventBus,
    private readonly notifier: UserNotifier,
  ) {}

  onModuleInit() {
    this.events.subscribe(OrderPaid, (event) => this.handle(event));
  }

  async handle(event: OrderPaid): Promise<void> {
    const ref = orderRef(event.orderId);
    await Promise.all([
      this.notifier.notify(
        event.buyerId,
        `Paiement reçu pour la commande ${ref}`,
        (name) => `Salut ${name},\n\nOn a bien reçu ${formatPrice(event.totalCents)}. Le vendeur va expédier :\n${itemList(event.itemTitles)}`,
      ),
      this.notifier.notify(
        event.sellerId,
        `Vendu ! Commande ${ref} à expédier`,
        (name) =>
          `Salut ${name},\n\nL'acheteur a payé ${formatPrice(event.totalCents)}. À expédier :\n${itemList(event.itemTitles)}\n\nPense à renseigner le numéro de suivi.`,
      ),
    ]);
  }
}
