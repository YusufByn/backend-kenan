import { Injectable } from "@nestjs/common";
import { OrderRepository } from "../domain/order.repository.js";
import { OrderQueries, type OrderSummary } from "./order-queries.js";

/** Implémentation du contrat public. Privée au contexte : non exportée par public-api.ts. */
@Injectable()
export class OrderingOrderQueries extends OrderQueries {
  constructor(private readonly orders: OrderRepository) {
    super();
  }

  async findById(id: string): Promise<OrderSummary | null> {
    const order = await this.orders.findById(id);
    if (!order) return null;
    const { buyerId, sellerId, status } = order.toPrimitives();
    return { id, buyerId, sellerId, delivered: status === "delivered" };
  }
}
