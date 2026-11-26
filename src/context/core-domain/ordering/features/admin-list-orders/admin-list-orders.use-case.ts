import { Injectable } from "@nestjs/common";
import type { Page } from "@core/http/pagination.js";
import type { OrderPrimitives } from "../../domain/order.js";
import { OrderRepository, type OrderSearch } from "../../domain/order.repository.js";

@Injectable()
export class AdminListOrdersUseCase {
  constructor(private readonly orders: OrderRepository) {}

  async execute(criteria: OrderSearch): Promise<Page<OrderPrimitives>> {
    const { items, total } = await this.orders.search(criteria);
    return { items: items.map((order) => order.toPrimitives()), page: criteria.page, limit: criteria.limit, total };
  }
}
