import { Injectable } from "@nestjs/common";
import { ListingReservations } from "@catalog";
import { EventBus } from "@core/events/event-bus.js";
import type { OrderPrimitives } from "../../domain/order.js";
import { OrderRepository } from "../../domain/order.repository.js";
import { OrderCancelled } from "../../public/events/order-events.js";

@Injectable()
export class CancelOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly reservations: ListingReservations,
    private readonly events: EventBus,
  ) {}

  async execute(userId: string, orderId: string): Promise<OrderPrimitives> {
    const order = await this.orders.getVisibleTo(orderId, userId);
    order.cancel(userId, new Date());
    // Les vélos sont remis en vente.
    await this.reservations.release(order.listingIds);
    await this.orders.save(order);

    const saved = order.toPrimitives();
    this.events.publish(new OrderCancelled(saved, userId));
    return saved;
  }
}
