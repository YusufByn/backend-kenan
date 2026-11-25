import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ListingQueries, ListingReservations, type ListingSummary } from "@catalog";
import { EventBus } from "@core/events/event-bus.js";
import { CartRepository } from "../../domain/cart.repository.js";
import { Order, type OrderPrimitives, type ShippingAddress } from "../../domain/order.js";
import { EmptyCartError, ListingUnavailableError } from "../../domain/order.errors.js";
import { OrderRepository } from "../../domain/order.repository.js";
import { OrderPlaced } from "../../public/events/order-events.js";

@Injectable()
export class CheckoutUseCase {
  constructor(
    private readonly carts: CartRepository,
    private readonly orders: OrderRepository,
    private readonly listings: ListingQueries,
    private readonly reservations: ListingReservations,
    private readonly events: EventBus,
  ) {}

  /** Transforme le panier en commandes (une par vendeur). Tout ou rien. */
  async execute(buyerId: string, shippingAddress: ShippingAddress): Promise<OrderPrimitives[]> {
    const cart = await this.carts.get(buyerId);
    if (cart.isEmpty) throw new EmptyCartError();

    const listingIds = cart.listingIds;
    const listings = await this.listings.findByIds(listingIds);
    if (listings.length !== listingIds.length || listings.some((listing) => !listing.available)) {
      throw new ListingUnavailableError();
    }

    // Construire (et donc valider) les commandes avant de toucher au catalogue.
    const now = new Date();
    const orders = [...groupBySeller(listings)].map(([sellerId, sellerListings]) =>
      Order.place({
        id: randomUUID(),
        buyerId,
        sellerId,
        shippingAddress,
        now,
        lines: sellerListings.map(({ id, title, priceCents }) => ({ listingId: id, title, priceCents })),
      }),
    );

    // 409 si un autre acheteur a réservé une annonce entre-temps : aucune commande n'est créée.
    await this.reservations.reserve(listingIds);
    try {
      await this.orders.saveAll(orders);
    } catch (error) {
      // Les commandes n'ont pas pu être enregistrées : on remet les annonces en vente.
      await this.reservations.release(listingIds);
      throw error;
    }

    cart.clear();
    await this.carts.save(cart);

    const placed = orders.map((order) => order.toPrimitives());
    this.events.publish(...placed.map((order) => new OrderPlaced(order)));
    return placed;
  }
}

function groupBySeller(listings: ListingSummary[]): Map<string, ListingSummary[]> {
  const groups = new Map<string, ListingSummary[]>();
  for (const listing of listings) groups.set(listing.sellerId, [...(groups.get(listing.sellerId) ?? []), listing]);
  return groups;
}
