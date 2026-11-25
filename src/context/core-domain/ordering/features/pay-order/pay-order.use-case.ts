import { Injectable } from "@nestjs/common";
import { EventBus } from "@core/events/event-bus.js";
import type { OrderPrimitives } from "../../domain/order.js";
import { OrderRepository } from "../../domain/order.repository.js";
import { OrderPaid } from "../../public/events/order-events.js";

@Injectable()
export class PayOrderUseCase {
  constructor(
    private readonly orders: OrderRepository,
    private readonly events: EventBus,
  ) {}

  /** Paiement simulé : aucun prestataire n'est appelé. */
  async execute(userId: string, orderId: string): Promise<OrderPrimitives> {
    const order = await this.orders.getVisibleTo(orderId, userId);
    order.pay(userId, new Date());
    await this.orders.save(order);

    const saved = order.toPrimitives();
    this.events.publish(new OrderPaid(saved));
    return saved;
  }
}
