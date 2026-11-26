import { Injectable } from "@nestjs/common";
import type { Page, PageRequest } from "@core/http/pagination.js";
import type { ListingPrimitives, ListingStatus } from "../../domain/listing.js";
import { ListingRepository } from "../../domain/listing.repository.js";

@Injectable()
export class ListMyListingsUseCase {
  constructor(private readonly listings: ListingRepository) {}

  /** Tous statuts confondus (brouillons compris), ou un seul si `status` est donné. */
  async execute(sellerId: string, criteria: PageRequest & { status?: ListingStatus }): Promise<Page<ListingPrimitives>> {
    const { items, total } = await this.listings.findBySeller(sellerId, criteria);
    return { items: items.map((listing) => listing.toPrimitives()), page: criteria.page, limit: criteria.limit, total };
  }
}
