import { Injectable } from "@nestjs/common";
import type { ListingDetails, ListingPrimitives } from "../../domain/listing.entity.js";
import { ListingRepository } from "../../domain/listing.repository.js";

@Injectable()
export class UpdateListingHandler {
  constructor(private readonly listings: ListingRepository) {}

  async execute(sellerId: string, id: string, changes: Partial<ListingDetails>): Promise<ListingPrimitives> {
    const listing = await this.listings.getOwnedBy(id, sellerId);
    listing.update(changes);
    await this.listings.save(listing);
    return listing.toPrimitives();
  }
}
