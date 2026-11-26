import { Injectable } from "@nestjs/common";
import type { Page, PageRequest } from "@core/http/pagination.js";
import type { OrderPrimitives, OrderStatus } from "../../domain/order.js";
import { OrderRepository } from "../../domain/order.repository.js";

/** Mes achats, plus récents d'abord. */
@Injectable()
export class ListMyOrdersUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(buyerId: string, criteria: PageRequest & { status?: OrderStatus }): Promise<Page<OrderPrimitives>> {
    const { items, total } = await this.orders.search({ ...criteria, buyerId });
    return { items: items.map((order) => order.toPrimitives()), page: criteria.page, limit: criteria.limit, total };
  }
}
