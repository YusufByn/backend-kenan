import { Injectable } from "@nestjs/common";
import type { OrderPrimitives } from "../../domain/order.entity.js";
import { OrderRepository } from "../../domain/order.repository.js";

@Injectable()
export class ListMyOrdersHandler {
  constructor(private readonly orders: OrderRepository) {}

  async execute(buyerId: string): Promise<OrderPrimitives[]> {
    const orders = await this.orders.findByBuyer(buyerId);
    return orders.map((order) => order.toPrimitives());
  }
}
