import { Injectable } from "@nestjs/common";
import { EventBus } from "@core/events/event-bus.js";
import type { OrderPrimitives } from "../../domain/order.entity.js";
import { OrderRepository } from "../../domain/order.repository.js";
import { OrderShipped } from "../../public/events/order-events.js";

@Injectable()
export class ShipOrderHandler {
  constructor(
    private readonly orders: OrderRepository,
    private readonly events: EventBus,
  ) {}

  async execute(userId: string, orderId: string, trackingNumber: string): Promise<OrderPrimitives> {
    const order = await this.orders.getVisibleTo(orderId, userId);
    order.ship(userId, trackingNumber, new Date());
    await this.orders.save(order);

    const saved = order.toPrimitives();
    this.events.publish(new OrderShipped(saved));
    return saved;
  }
}
