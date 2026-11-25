import { Injectable } from "@nestjs/common";
import { ListingQueries } from "@catalog";
import { CartRepository } from "../../domain/cart.repository.js";

export type CartItemView = {
  listingId: string;
  title: string | null;
  priceCents: number | null;
  photoUrl: string | null;
  sellerId: string | null;
  /** false si l'annonce a été réservée, vendue ou retirée depuis l'ajout au panier. */
  available: boolean;
};

export type CartView = { items: CartItemView[]; totalCents: number; hasUnavailableItems: boolean };

@Injectable()
export class GetCartHandler {
  constructor(
    private readonly carts: CartRepository,
    private readonly listings: ListingQueries,
  ) {}

  /** Prix toujours relus dans le catalogue : le panier affiche le prix actuel. */
  async execute(userId: string): Promise<CartView> {
    const cart = await this.carts.get(userId);
    const summaries = new Map((await this.listings.findByIds(cart.listingIds)).map((s) => [s.id, s]));

    const items = cart.listingIds.map((listingId): CartItemView => {
      const listing = summaries.get(listingId);
      if (!listing) return { listingId, title: null, priceCents: null, photoUrl: null, sellerId: null, available: false };
      const { title, priceCents, photoUrl, sellerId, available } = listing;
      return { listingId, title, priceCents, photoUrl, sellerId, available };
    });

    return {
      items,
      totalCents: items.reduce((sum, item) => sum + (item.available ? (item.priceCents ?? 0) : 0), 0),
      hasUnavailableItems: items.some((item) => !item.available),
    };
  }
}
