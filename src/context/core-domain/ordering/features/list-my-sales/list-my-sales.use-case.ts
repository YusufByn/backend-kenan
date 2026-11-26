import { Injectable } from "@nestjs/common";
import type { Page, PageRequest } from "@core/http/pagination.js";
import type { OrderPrimitives, OrderStatus } from "../../domain/order.js";
import { OrderRepository } from "../../domain/order.repository.js";

/** Mes ventes, plus récentes d'abord. */
@Injectable()
export class ListMySalesUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(sellerId: string, criteria: PageRequest & { status?: OrderStatus }): Promise<Page<OrderPrimitives>> {
    const { items, total } = await this.orders.search({ ...criteria, sellerId });
    return { items: items.map((order) => order.toPrimitives()), page: criteria.page, limit: criteria.limit, total };
  }
}
