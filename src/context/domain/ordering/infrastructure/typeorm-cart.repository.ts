import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { Cart } from "../domain/cart.js";
import { CartRepository } from "../domain/cart.repository.js";
import { CartItemOrmEntity } from "./cart-item.orm-entity.js";

@Injectable()
export class TypeOrmCartRepository extends CartRepository {
  constructor(
    @InjectRepository(CartItemOrmEntity)
    private readonly orm: Repository<CartItemOrmEntity>,
  ) {
    super();
  }

  async get(userId: string): Promise<Cart> {
    const rows = await this.orm.find({ where: { userId }, order: { addedAt: "ASC" } });
    return Cart.restore(
      userId,
      rows.map(({ listingId, addedAt }) => ({ listingId, addedAt })),
    );
  }

  /** Remplace toutes les lignes du user par celles du panier. */
  async save(cart: Cart): Promise<void> {
    const { userId, items } = cart.toPrimitives();
    await this.orm.manager.transaction(async (manager) => {
      await manager.delete(CartItemOrmEntity, { userId });
      if (items.length > 0) await manager.insert(CartItemOrmEntity, items.map((item) => ({ userId, ...item })));
    });
  }
}
