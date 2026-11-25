import { Injectable, type OnModuleInit } from "@nestjs/common";
import { OrderShipped } from "@ordering";
import { EventBus } from "@core/events/event-bus.js";
import { itemList, orderRef } from "../../common/format.js";
import { UserNotifier } from "../../common/user-notifier.js";

/** Acheteur : colis en route, avec le numéro de suivi. */
@Injectable()
export class OrderShippedEmailListener implements OnModuleInit {
  constructor(
    private readonly events: EventBus,
    private readonly notifier: UserNotifier,
  ) {}

  onModuleInit() {
    this.events.subscribe(OrderShipped, (event) => this.handle(event));
  }

  async handle(event: OrderShipped): Promise<void> {
    await this.notifier.notify(
      event.buyerId,
      `Commande ${orderRef(event.orderId)} expédiée`,
      (name) =>
        `Salut ${name},\n\nTa commande est en route :\n${itemList(event.itemTitles)}\n\nNuméro de suivi : ${event.trackingNumber}\nPense à confirmer la réception à l'arrivée.`,
    );
  }
}
