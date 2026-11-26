import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, LessThan, type FindOptionsWhere, type Repository } from "typeorm";
import { offsetOf } from "@core/http/pagination.js";
import { Order, type OrderLine } from "../domain/order.js";
import { OrderRepository, type OrderSearch } from "../domain/order.repository.js";
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

  async findUnpaidCreatedBefore(before: Date): Promise<Order[]> {
    return this.withLines(await this.orders.findBy({ status: "pending_payment", createdAt: LessThan(before) }));
  }

  async findShippedBefore(before: Date): Promise<Order[]> {
    return this.withLines(await this.orders.findBy({ status: "shipped", shippedAt: LessThan(before) }));
  }

  async findOpenInvolving(userId: string): Promise<Order[]> {
    const open = In(["pending_payment", "paid"]);
    // Un tableau de conditions = OR : acheteur OU vendeur.
    return this.withLines(await this.orders.findBy([{ buyerId: userId, status: open }, { sellerId: userId, status: open }]));
  }

  async search(criteria: OrderSearch): Promise<{ items: Order[]; total: number }> {
    // Seulement les critères fournis : TypeORM 1.x refuse une valeur undefined dans un where.
    const where: FindOptionsWhere<OrderOrmEntity> = {};
    if (criteria.status) where.status = criteria.status;
    if (criteria.buyerId) where.buyerId = criteria.buyerId;
    if (criteria.sellerId) where.sellerId = criteria.sellerId;

    const [rows, total] = await this.orders.findAndCount({
      where,
      order: { createdAt: "DESC", id: "ASC" }, // ordre stable entre deux pages
      skip: offsetOf(criteria),
      take: criteria.limit,
    });
    return { items: await this.withLines(rows), total };
  }

  async saveAll(orders: Order[]): Promise<void> {
    await this.orders.manager.transaction(async (manager) => {
      for (const order of orders) {
        // paymentDueAt est calculé, pas stocké.
        const { lines, paymentDueAt: _computed, ...row } = order.toPrimitives();
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
