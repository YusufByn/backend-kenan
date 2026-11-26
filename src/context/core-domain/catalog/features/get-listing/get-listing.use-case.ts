import { Injectable } from "@nestjs/common";
import { UserQueries } from "@identity";
import type { ListingPrimitives } from "../../domain/listing.js";
import { ListingNotFoundError } from "../../domain/listing.errors.js";
import { FavoriteRepository } from "../../domain/favorite.repository.js";
import { ListingRepository } from "../../domain/listing.repository.js";

export type ListingDetailView = ListingPrimitives & {
  seller: { id: string; name: string | null };
  /** Nombre de personnes qui suivent l'annonce : preuve sociale affichée sur la fiche. */
  favoritesCount: number;
};

@Injectable()
export class GetListingUseCase {
  constructor(
    private readonly listings: ListingRepository,
    private readonly users: UserQueries,
    private readonly favorites: FavoriteRepository,
  ) {}

  /** Brouillons et annonces archivées : 404 (le vendeur les voit via GET /me/listings). */
  async execute(id: string): Promise<ListingDetailView> {
    const listing = await this.listings.getById(id);
    if (!listing.isPublic) throw new ListingNotFoundError(id);

    const [seller, favoritesCount] = await Promise.all([
      this.users.findById(listing.sellerId),
      this.favorites.countByListing(listing.id),
    ]);
    return { ...listing.toPrimitives(), seller: { id: listing.sellerId, name: seller?.name ?? null }, favoritesCount };
  }
}
