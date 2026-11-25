import { Injectable } from "@nestjs/common";
import { ListingRepository } from "../domain/listing.repository.js";
import { ListingQueries, type ListingSummary } from "./listing-queries.js";

/** Implémentation du contrat public. Privée au contexte : non exportée par public-api.ts. */
@Injectable()
export class CatalogListingQueries extends ListingQueries {
  constructor(private readonly listings: ListingRepository) {
    super();
  }

  async findByIds(ids: string[]): Promise<ListingSummary[]> {
    const listings = await this.listings.findByIds(ids);
    return listings.map((listing) => {
      const { id, sellerId, title, priceCents, photoUrls, status } = listing.toPrimitives();
      return { id, sellerId, title, priceCents, photoUrl: photoUrls[0] ?? null, available: status === "published" };
    });
  }
}
