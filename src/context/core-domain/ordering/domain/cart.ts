import { CannotBuyOwnListingError } from "./order.errors.js";

export type CartItem = { listingId: string; addedAt: Date };

/** Le panier d'un user : une liste d'annonces. Les prix ne sont pas stockés, ils sont relus au checkout. */
export class Cart {
  private constructor(
    readonly userId: string,
    private items: CartItem[],
  ) {}

  static restore(userId: string, items: CartItem[]): Cart {
    return new Cart(userId, [...items]);
  }

  get listingIds(): string[] {
    return this.items.map((item) => item.listingId);
  }

  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  /** Ajouter deux fois la même annonce ne fait rien. */
  add(listing: { id: string; sellerId: string }, now: Date): void {
    if (listing.sellerId === this.userId) throw new CannotBuyOwnListingError();
    if (this.items.some((item) => item.listingId === listing.id)) return;
    this.items.push({ listingId: listing.id, addedAt: now });
  }

  remove(listingId: string): void {
    this.items = this.items.filter((item) => item.listingId !== listingId);
  }

  clear(): void {
    this.items = [];
  }

  toPrimitives(): { userId: string; items: CartItem[] } {
    return { userId: this.userId, items: [...this.items] };
  }
}
