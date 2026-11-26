import { Injectable, type OnModuleInit } from "@nestjs/common";
import { ListingPriceDropped } from "@catalog";
import { EventBus } from "@core/events/event-bus.js";
import { formatPrice, frontLink } from "../../common/format.js";
import { UserNotifier } from "../../common/user-notifier.js";

/** Alerte "baisse de prix" à tous ceux qui ont l'annonce en favori. La liste vient de l'événement : pas d'appel à catalog. */
@Injectable()
export class PriceDropEmailsListener implements OnModuleInit {
  constructor(
    private readonly events: EventBus,
    private readonly notifier: UserNotifier,
  ) {}

  onModuleInit() {
    this.events.subscribe(ListingPriceDropped, (event) => this.handle(event));
  }

  async handle(event: ListingPriceDropped): Promise<void> {
    const drop = Math.round((1 - event.newPriceCents / event.oldPriceCents) * 100);
    await Promise.all(
      event.watcherIds.map((userId) =>
        this.notifier.notify(
          userId,
          `Baisse de prix (-${drop} %) : ${event.title}`,
          (name) =>
            `Salut ${name},\n\nUn vélo que tu suis vient de baisser : ${formatPrice(event.oldPriceCents)} → ${formatPrice(event.newPriceCents)}.\n` +
            `${frontLink(`/listings/${event.listingId}`)}`,
        ),
      ),
    );
  }
}
