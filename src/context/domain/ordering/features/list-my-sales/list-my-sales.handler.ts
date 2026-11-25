import { Injectable } from "@nestjs/common";
import type { OrderPrimitives } from "../../domain/order.entity.js";
import { OrderRepository } from "../../domain/order.repository.js";

@Injectable()
export class ListMySalesHandler {
  constructor(private readonly orders: OrderRepository) {}

  async execute(sellerId: string): Promise<OrderPrimitives[]> {
    const orders = await this.orders.findBySeller(sellerId);
    return orders.map((order) => order.toPrimitives());
  }
}
