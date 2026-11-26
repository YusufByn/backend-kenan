import { Injectable } from "@nestjs/common";
import { FavoriteRepository } from "../../domain/favorite.repository.js";
import { ListingNotFavoritableError, ListingNotFoundError } from "../../domain/listing.errors.js";
import { ListingRepository } from "../../domain/listing.repository.js";

/** Suivre une annonce : elle apparaît dans GET /me/favorites, et on est prévenu par email si son prix baisse. */
@Injectable()
export class AddFavoriteUseCase {
  constructor(
    private readonly listings: ListingRepository,
    private readonly favorites: FavoriteRepository,
  ) {}

  async execute(userId: string, listingId: string): Promise<void> {
    const listing = await this.listings.getById(listingId);
    // Un brouillon ou une annonce archivée n'existe pas pour les autres : 404, comme GET /listings/:id.
    if (!listing.isPublic) throw new ListingNotFoundError(listingId);
    if (listing.isOwnedBy(userId)) throw new ListingNotFavoritableError("Tu ne peux pas mettre ta propre annonce en favori");
    if (!listing.canBeFavorited) throw new ListingNotFavoritableError("Cette annonce est déjà vendue");

    await this.favorites.add({ userId, listingId, createdAt: new Date() });
  }
}
