import { Injectable } from "@nestjs/common";
import type { ListingPrimitives } from "../../domain/listing.entity.js";
import { ListingRepository, type ListingSearch } from "../../domain/listing.repository.js";

export type ListingPage = { items: ListingPrimitives[]; page: number; limit: number; total: number };

@Injectable()
export class SearchListingsHandler {
  constructor(private readonly listings: ListingRepository) {}

  async execute(criteria: ListingSearch): Promise<ListingPage> {
    const { items, total } = await this.listings.searchPublished(criteria);
    return { items: items.map((listing) => listing.toPrimitives()), page: criteria.page, limit: criteria.limit, total };
  }
}
