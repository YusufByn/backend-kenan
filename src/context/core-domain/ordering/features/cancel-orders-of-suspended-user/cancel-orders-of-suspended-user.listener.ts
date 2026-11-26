import { Injectable, Logger, type OnModuleInit } from "@nestjs/common";
import { ListingReservations } from "@catalog";
import { UserSuspended } from "@identity";
import { EventBus } from "@core/events/event-bus.js";
import { OrderRepository } from "../../domain/order.repository.js";
import { OrderCancelled } from "../../public/events/order-events.js";

/**
 * Déclenché par un événement d'identity : les commandes pas encore expédiées d'un compte suspendu
 * sont annulées (remboursement simulé si payées), pour que l'autre partie ne reste pas bloquée.
 * - suspendu = acheteur : les vélos repartent en vente ;
 * - suspendu = vendeur : les vélos sont retirés de la vente (brouillon), comme ses autres annonces.
 *   Pas de "release" : il remettrait en ligne des vélos que catalog vient de retirer (les deux listeners tournent en même temps).
 * Les commandes déjà expédiées se terminent normalement.
 */
@Injectable()
export class CancelOrdersOfSuspendedUserListener implements OnModuleInit {
  private readonly logger = new Logger("CancelOrdersOfSuspendedUser");

  constructor(
    private readonly events: EventBus,
    private readonly orders: OrderRepository,
    private readonly reservations: ListingReservations,
  ) {}

  onModuleInit() {
    this.events.subscribe(UserSuspended, (event) => this.handle(event));
  }

  async handle(event: UserSuspended): Promise<void> {
    const now = new Date();
    for (const order of await this.orders.findOpenInvolving(event.userId)) {
      try {
        order.cancel(event.userId, now);
        if (order.isSoldBy(event.userId)) await this.reservations.withdraw(order.listingIds);
        else await this.reservations.release(order.listingIds);
        await this.orders.save(order);
        this.events.publish(new OrderCancelled(order.toPrimitives(), event.userId, "account_suspended"));
        this.logger.log(`Commande ${order.id} annulée (compte ${event.userId} suspendu)`);
      } catch (error) {
        this.logger.error(`Commande ${order.id} non annulée : ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }
}
