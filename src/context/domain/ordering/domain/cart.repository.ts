import type { Cart } from "./cart.js";

/** Port : stockage des paniers. */
export abstract class CartRepository {
  /** Un user sans panier a un panier vide : jamais null. */
  abstract get(userId: string): Promise<Cart>;
  abstract save(cart: Cart): Promise<void>;
}
