import { Injectable } from "@nestjs/common";
import type { OrderPrimitives } from "../../domain/order.js";
import { OrderRepository } from "../../domain/order.repository.js";

@Injectable()
export class GetOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(userId: string, orderId: string): Promise<OrderPrimitives> {
    const order = await this.orders.getVisibleTo(orderId, userId);
    return order.toPrimitives();
  }
}
