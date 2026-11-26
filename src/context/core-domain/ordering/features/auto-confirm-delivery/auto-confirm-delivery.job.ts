import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ListingReservations } from "@catalog";
import { EventBus } from "@core/events/event-bus.js";
import { AUTO_DELIVERY_DELAY_MS } from "../../domain/order.js";
import { OrderRepository } from "../../domain/order.repository.js";
import { OrderDelivered } from "../../public/events/order-events.js";

/**
 * Déclenché par l'horloge (toutes les heures) : un acheteur qui ne confirme jamais la réception
 * ne doit pas bloquer la vente. 14 jours après l'expédition, la livraison est confirmée d'office :
 * annonces vendues, même événement OrderDelivered que la confirmation manuelle (avec automatic = true).
 */
@Injectable()
export class AutoConfirmDeliveryJob {
  private readonly logger = new Logger("AutoConfirmDelivery");

  constructor(
    private readonly orders: OrderRepository,
    private readonly reservations: ListingReservations,
    private readonly events: EventBus,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async run(): Promise<void> {
    const now = new Date();
    const due = await this.orders.findShippedBefore(new Date(now.getTime() - AUTO_DELIVERY_DELAY_MS));

    for (const order of due) {
      try {
        order.confirmDeliveryAutomatically(now);
        await this.reservations.markSold(order.listingIds);
        await this.orders.save(order);
        this.events.publish(new OrderDelivered(order.toPrimitives(), true));
        this.logger.log(`Commande ${order.id} : livraison confirmée d'office`);
      } catch (error) {
        this.logger.error(`Commande ${order.id} non confirmée : ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}
