import { Injectable } from "@nestjs/common";
import type { ListingPrimitives } from "../../domain/listing.js";
import { ListingRepository } from "../../domain/listing.repository.js";

@Injectable()
export class ListMyListingsUseCase {
  constructor(private readonly listings: ListingRepository) {}

  /** Tous statuts confondus, brouillons compris. */
  async execute(sellerId: string): Promise<ListingPrimitives[]> {
    const listings = await this.listings.findBySeller(sellerId);
    return listings.map((listing) => listing.toPrimitives());
  }
}
