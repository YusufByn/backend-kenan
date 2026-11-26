import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ListingReservations } from "@catalog";
import { EventBus } from "@core/events/event-bus.js";
import { PAYMENT_DEADLINE_MS } from "../../domain/order.js";
import { OrderRepository } from "../../domain/order.repository.js";
import { OrderExpired } from "../../public/events/order-events.js";

/**
 * Déclenché par l'horloge (toutes les 10 minutes), pas par une route : une commande non payée
 * dans les 48 h est annulée et ses vélos remis en vente, sinon un acheteur qui oublie de payer
 * bloquerait les annonces indéfiniment. Une commande en échec n'empêche pas de traiter les autres.
 */
@Injectable()
export class ExpireUnpaidOrdersJob {
  private readonly logger = new Logger("ExpireUnpaidOrders");

  constructor(
    private readonly orders: OrderRepository,
    private readonly reservations: ListingReservations,
    private readonly events: EventBus,
  ) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async run(): Promise<void> {
    const now = new Date();
    const overdue = await this.orders.findUnpaidCreatedBefore(new Date(now.getTime() - PAYMENT_DEADLINE_MS));

    for (const order of overdue) {
      try {
        order.expire(now);
        await this.reservations.release(order.listingIds);
        await this.orders.save(order);
        this.events.publish(new OrderExpired(order.toPrimitives()));
        this.logger.log(`Commande ${order.id} expirée (non payée à temps), annonces remises en vente`);
      } catch (error) {
        this.logger.error(`Commande ${order.id} non expirée : ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}
