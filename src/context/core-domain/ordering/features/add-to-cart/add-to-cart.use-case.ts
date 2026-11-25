import { Injectable } from "@nestjs/common";
import { ListingQueries } from "@catalog";
import { CartRepository } from "../../domain/cart.repository.js";
import { ListingUnavailableError } from "../../domain/order.errors.js";

@Injectable()
export class AddToCartUseCase {
  constructor(
    private readonly carts: CartRepository,
    private readonly listings: ListingQueries,
  ) {}

  async execute(userId: string, listingId: string): Promise<void> {
    const [listing] = await this.listings.findByIds([listingId]);
    if (!listing || !listing.available) throw new ListingUnavailableError();

    const cart = await this.carts.get(userId);
    cart.add({ id: listing.id, sellerId: listing.sellerId }, new Date());
    await this.carts.save(cart);
  }
}
