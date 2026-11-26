import { Injectable } from "@nestjs/common";
import type { Page } from "@core/http/pagination.js";
import type { ListingPrimitives } from "../../domain/listing.js";
import { ListingRepository, type ListingSearch } from "../../domain/listing.repository.js";

@Injectable()
export class SearchListingsUseCase {
  constructor(private readonly listings: ListingRepository) {}

  async execute(criteria: ListingSearch): Promise<Page<ListingPrimitives>> {
    const { items, total } = await this.listings.searchPublished(criteria);
    return { items: items.map((listing) => listing.toPrimitives()), page: criteria.page, limit: criteria.limit, total };
  }
}
