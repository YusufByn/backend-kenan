import { Injectable } from "@nestjs/common";
import { CartRepository } from "../../domain/cart.repository.js";

@Injectable()
export class RemoveFromCartUseCase {
  constructor(private readonly carts: CartRepository) {}

  /** Retirer une annonce absente du panier ne fait rien. */
  async execute(userId: string, listingId: string): Promise<void> {
    const cart = await this.carts.get(userId);
    cart.remove(listingId);
    await this.carts.save(cart);
  }
}
