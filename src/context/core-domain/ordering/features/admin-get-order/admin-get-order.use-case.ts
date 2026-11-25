import { Injectable } from "@nestjs/common";
import type { OrderPrimitives } from "../../domain/order.js";
import { OrderRepository } from "../../domain/order.repository.js";

/** Lecture seule pour le support : n'importe quelle commande, sans être acheteur ni vendeur. */
@Injectable()
export class AdminGetOrderUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(orderId: string): Promise<OrderPrimitives> {
    const order = await this.orders.getById(orderId);
    return order.toPrimitives();
  }
}
