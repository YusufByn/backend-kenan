import type { Order, OrderStatus } from "./order.js";
import { OrderNotFoundError } from "./order.errors.js";

/** Recherche de commandes pour le support (toutes les commandes, pas seulement les siennes). */
export type OrderSearch = {
  status?: OrderStatus;
  buyerId?: string;
  sellerId?: string;
  page: number;
  limit: number;
};

/** Port : stockage des commandes. */
export abstract class OrderRepository {
  abstract findById(id: string): Promise<Order | null>;
  /** Plus récentes d'abord. */
  abstract search(criteria: OrderSearch): Promise<{ items: Order[]; total: number }>;
  /** Plus récentes d'abord. */
  abstract findByBuyer(buyerId: string): Promise<Order[]>;
  /** Plus récentes d'abord. */
  abstract findBySeller(sellerId: string): Promise<Order[]>;
  /** Tout ou rien (transaction). */
  abstract saveAll(orders: Order[]): Promise<void>;

  save(order: Order): Promise<void> {
    return this.saveAll([order]);
  }

  async getById(id: string): Promise<Order> {
    const order = await this.findById(id);
    if (!order) throw new OrderNotFoundError(id);
    return order;
  }

  /** Une commande où l'on n'est ni acheteur ni vendeur est traitée comme introuvable (404). */
  async getVisibleTo(id: string, userId: string): Promise<Order> {
    const order = await this.findById(id);
    if (!order || !order.isVisibleTo(userId)) throw new OrderNotFoundError(id);
    return order;
  }
}
