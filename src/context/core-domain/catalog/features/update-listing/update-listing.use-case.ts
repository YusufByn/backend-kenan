import { Injectable } from "@nestjs/common";
import { EventBus } from "@core/events/event-bus.js";
import { FavoriteRepository } from "../../domain/favorite.repository.js";
import type { ListingDetails, ListingPrimitives } from "../../domain/listing.js";
import { ListingRepository } from "../../domain/listing.repository.js";
import { ListingPriceDropped } from "../../public/events/listing-price-dropped.event.js";

@Injectable()
export class UpdateListingUseCase {
  constructor(
    private readonly listings: ListingRepository,
    private readonly favorites: FavoriteRepository,
    private readonly events: EventBus,
  ) {}

  async execute(sellerId: string, id: string, changes: Partial<ListingDetails>): Promise<ListingPrimitives> {
    const listing = await this.listings.getOwnedBy(id, sellerId);
    const previousPrice = listing.priceCents;
    listing.update(changes);
    await this.listings.save(listing);

    // Baisse de prix sur une annonce en ligne : ceux qui la suivent sont prévenus (notifications).
    if (listing.status === "published" && listing.priceCents < previousPrice) {
      const watcherIds = await this.favorites.findUserIdsByListing(listing.id);
      if (watcherIds.length > 0) {
        this.events.publish(new ListingPriceDropped(listing.id, listing.title, previousPrice, listing.priceCents, watcherIds));
      }
    }
    return listing.toPrimitives();
  }
}
