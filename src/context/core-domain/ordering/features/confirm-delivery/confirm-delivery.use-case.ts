import { Injectable } from "@nestjs/common";
import { ListingReservations } from "@catalog";
import { EventBus } from "@core/events/event-bus.js";
import type { OrderPrimitives } from "../../domain/order.js";
import { OrderRepository } from "../../domain/order.repository.js";
import { OrderDelivered } from "../../public/events/order-events.js";

@Injectable()
export class ConfirmDeliveryUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly reservations: ListingReservations,
    private readonly events: EventBus,
  ) {}

  async execute(userId: string, orderId: string): Promise<OrderPrimitives> {
    const order = await this.orders.getVisibleTo(orderId, userId);
    order.confirmDelivery(userId, new Date());
    // Les annonces passent en "sold" avant d'enregistrer la commande : si ça échoue, la commande reste "shipped".
    await this.reservations.markSold(order.listingIds);
    await this.orders.save(order);

    const saved = order.toPrimitives();
    this.events.publish(new OrderDelivered(saved));
    return saved;
  }
}
