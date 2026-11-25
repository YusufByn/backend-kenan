import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, type Repository } from "typeorm";
import { Order, type OrderLine } from "../domain/order.entity.js";
import { OrderRepository } from "../domain/order.repository.js";
import { OrderLineOrmEntity, OrderOrmEntity } from "./order.orm-entity.js";

@Injectable()
export class TypeOrmOrderRepository extends OrderRepository {
  constructor(
    @InjectRepository(OrderOrmEntity)
    private readonly orders: Repository<OrderOrmEntity>,
    @InjectRepository(OrderLineOrmEntity)
    private readonly lines: Repository<OrderLineOrmEntity>,
  ) {
    super();
  }

  async findById(id: string): Promise<Order | null> {
    const row = await this.orders.findOneBy({ id });
    if (!row) return null;
    const [order] = await this.withLines([row]);
    return order ?? null;
  }

  async findByBuyer(buyerId: string): Promise<Order[]> {
    return this.withLines(await this.orders.find({ where: { buyerId }, order: { createdAt: "DESC" } }));
  }

  async findBySeller(sellerId: string): Promise<Order[]> {
    return this.withLines(await this.orders.find({ where: { sellerId }, order: { createdAt: "DESC" } }));
  }

  async saveAll(orders: Order[]): Promise<void> {
    await this.orders.manager.transaction(async (manager) => {
      for (const order of orders) {
        const { lines, ...row } = order.toPrimitives();
        await manager.save(OrderOrmEntity, row);
        // Les lignes ne changent jamais après le checkout : save() les insère la première fois, puis ne fait rien.
        await manager.save(
          OrderLineOrmEntity,
          lines.map((line) => ({ orderId: order.id, ...line })),
        );
      }
    });
  }

  /** Charge les lignes de plusieurs commandes en une seule requête. */
  private async withLines(rows: OrderOrmEntity[]): Promise<Order[]> {
    if (rows.length === 0) return [];
    const lineRows = await this.lines.findBy({ orderId: In(rows.map((row) => row.id)) });

    const linesByOrder = new Map<string, OrderLine[]>();
    for (const { orderId, listingId, title, priceCents } of lineRows) {
      linesByOrder.set(orderId, [...(linesByOrder.get(orderId) ?? []), { listingId, title, priceCents }]);
    }
    return rows.map((row) => Order.restore({ ...row, lines: linesByOrder.get(row.id) ?? [] }));
  }
}
