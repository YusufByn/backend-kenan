import { Injectable, type OnModuleInit } from "@nestjs/common";
import { OrderPlaced } from "@ordering";
import { EventBus } from "@core/events/event-bus.js";
import { formatPrice, itemList, orderRef } from "../../common/format.js";
import { UserNotifier } from "../../common/user-notifier.js";

/** Acheteur : commande créée, il reste à payer. */
@Injectable()
export class OrderPlacedEmailListener implements OnModuleInit {
  constructor(
    private readonly events: EventBus,
    private readonly notifier: UserNotifier,
  ) {}

  onModuleInit() {
    this.events.subscribe(OrderPlaced, (event) => this.handle(event));
  }

  async handle(event: OrderPlaced): Promise<void> {
    await this.notifier.notify(
      event.buyerId,
      `Commande ${orderRef(event.orderId)} enregistrée : ${formatPrice(event.totalCents)} à payer`,
      (name) =>
        `Salut ${name},\n\nCes vélos te sont réservés en attendant ton paiement :\n${itemList(event.itemTitles)}\n\nTotal : ${formatPrice(event.totalCents)}`,
    );
  }
}
