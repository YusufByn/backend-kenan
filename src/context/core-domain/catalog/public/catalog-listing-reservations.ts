import { Injectable } from "@nestjs/common";
import type { Listing } from "../domain/listing.js";
import { ListingConcurrentUpdateError, ListingNotAvailableError } from "../domain/listing.errors.js";
import { ListingRepository } from "../domain/listing.repository.js";
import { ListingReservations } from "./listing-reservations.js";

/** Implémentation du contrat public. Les règles de transition restent dans l'entité Listing. */
@Injectable()
export class CatalogListingReservations extends ListingReservations {
  constructor(private readonly listings: ListingRepository) {
    super();
  }

  async reserve(listingIds: string[]): Promise<void> {
    try {
      await this.transition(listingIds, (listing) => listing.reserve());
    } catch (error) {
      // Pour l'acheteur, "modifiée en même temps" veut dire "plus disponible".
      if (error instanceof ListingConcurrentUpdateError) throw new ListingNotAvailableError();
      throw error;
    }
  }

  release(listingIds: string[]): Promise<void> {
    return this.transition(listingIds, (listing) => listing.release());
  }

  markSold(listingIds: string[]): Promise<void> {
    return this.transition(listingIds, (listing) => listing.markSold());
  }

  withdraw(listingIds: string[]): Promise<void> {
    return this.transition(listingIds, (listing) => listing.withdraw());
  }

  private async transition(listingIds: string[], apply: (listing: Listing) => void): Promise<void> {
    const listings = await this.listings.findByIds(listingIds);
    if (listings.length !== new Set(listingIds).size) throw new ListingNotAvailableError();
    listings.forEach(apply);
    await this.listings.saveAll(listings);
  }
}
