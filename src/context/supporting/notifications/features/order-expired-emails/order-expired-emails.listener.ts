import { Injectable, type OnModuleInit } from "@nestjs/common";
import { OrderExpired } from "@ordering";
import { EventBus } from "@core/events/event-bus.js";
import { itemList, orderRef } from "../../common/format.js";
import { UserNotifier } from "../../common/user-notifier.js";

/** Commande non payée à temps : l'acheteur sait pourquoi elle a disparu, le vendeur que ses vélos sont de nouveau en vente. */
@Injectable()
export class OrderExpiredEmailsListener implements OnModuleInit {
  constructor(
    private readonly events: EventBus,
    private readonly notifier: UserNotifier,
  ) {}

  onModuleInit() {
    this.events.subscribe(OrderExpired, (event) => this.handle(event));
  }

  async handle(event: OrderExpired): Promise<void> {
    const ref = orderRef(event.orderId);
    await Promise.all([
      this.notifier.notify(
        event.buyerId,
        `Commande ${ref} annulée : pas de paiement`,
        (name) => `Salut ${name},\n\nTu n'as pas payé dans les 48 h, la commande est annulée :\n${itemList(event.itemTitles)}\n\nSi le vélo est encore en vente, tu peux le recommander.`,
      ),
      this.notifier.notify(
        event.sellerId,
        `Commande ${ref} expirée`,
        (name) => `Salut ${name},\n\nL'acheteur n'a pas payé dans les 48 h. Tes vélos sont de nouveau en vente :\n${itemList(event.itemTitles)}`,
      ),
    ]);
  }
}
