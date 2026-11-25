import type { Order } from "./order.js";
import { OrderNotFoundError } from "./order.errors.js";

/** Port : stockage des commandes. */
export abstract class OrderRepository {
  abstract findById(id: string): Promise<Order | null>;
  /** Plus récentes d'abord. */
  abstract findByBuyer(buyerId: string): Promise<Order[]>;
  /** Plus récentes d'abord. */
  abstract findBySeller(sellerId: string): Promise<Order[]>;
  /** Tout ou rien (transaction). */
  abstract saveAll(orders: Order[]): Promise<void>;

  save(order: Order): Promise<void> {
    return this.saveAll([order]);
  }

  /** Une commande où l'on n'est ni acheteur ni vendeur est traitée comme introuvable (404). */
  async getVisibleTo(id: string, userId: string): Promise<Order> {
    const order = await this.findById(id);
    if (!order || !order.isVisibleTo(userId)) throw new OrderNotFoundError(id);
    return order;
  }
}
