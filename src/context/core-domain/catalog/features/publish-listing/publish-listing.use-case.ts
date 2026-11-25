import { Injectable } from "@nestjs/common";
import type { ListingPrimitives } from "../../domain/listing.js";
import { ListingRepository } from "../../domain/listing.repository.js";

@Injectable()
export class PublishListingUseCase {
  constructor(private readonly listings: ListingRepository) {}

  async execute(sellerId: string, id: string): Promise<ListingPrimitives> {
    const listing = await this.listings.getOwnedBy(id, sellerId);
    listing.publish(new Date());
    await this.listings.save(listing);
    return listing.toPrimitives();
  }
}
