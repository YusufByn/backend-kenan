import { Injectable } from "@nestjs/common";
import { UserQueries } from "@identity";
import type { ListingPrimitives } from "../../domain/listing.entity.js";
import { ListingNotFoundError } from "../../domain/listing.errors.js";
import { ListingRepository } from "../../domain/listing.repository.js";

export type ListingDetailView = ListingPrimitives & { seller: { id: string; name: string | null } };

@Injectable()
export class GetListingHandler {
  constructor(
    private readonly listings: ListingRepository,
    private readonly users: UserQueries,
  ) {}

  /** Brouillons et annonces archivées : 404 (le vendeur les voit via GET /me/listings). */
  async execute(id: string): Promise<ListingDetailView> {
    const listing = await this.listings.getById(id);
    if (!listing.isPublic) throw new ListingNotFoundError(id);

    const seller = await this.users.findById(listing.sellerId);
    return { ...listing.toPrimitives(), seller: { id: listing.sellerId, name: seller?.name ?? null } };
  }
}
