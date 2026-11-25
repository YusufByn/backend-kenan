import { Injectable, type OnModuleInit } from "@nestjs/common";
import { OrderCancelled } from "@ordering";
import { EventBus } from "@core/events/event-bus.js";
import { itemList, orderRef } from "../../common/format.js";
import { UserNotifier } from "../../common/user-notifier.js";

/** Prévient l'autre partie : le vendeur si l'acheteur annule, et inversement. */
@Injectable()
export class OrderCancelledEmailListener implements OnModuleInit {
  constructor(
    private readonly events: EventBus,
    private readonly notifier: UserNotifier,
  ) {}

  onModuleInit() {
    this.events.subscribe(OrderCancelled, (event) => this.handle(event));
  }

  async handle(event: OrderCancelled): Promise<void> {
    const cancelledByBuyer = event.cancelledBy === event.buyerId;
    const recipientId = cancelledByBuyer ? event.sellerId : event.buyerId;
    const detail = cancelledByBuyer
      ? "L'acheteur a annulé la commande. Tes vélos sont de nouveau en vente :"
      : "Le vendeur a annulé la commande. Tu ne seras pas débité pour :";
    await this.notifier.notify(
      recipientId,
      `Commande ${orderRef(event.orderId)} annulée`,
      (name) => `Salut ${name},\n\n${detail}\n${itemList(event.itemTitles)}`,
    );
  }
}
