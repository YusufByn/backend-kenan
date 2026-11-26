import { Injectable } from "@nestjs/common";
import type { Page, PageRequest } from "@core/http/pagination.js";
import { FavoriteRepository } from "../../domain/favorite.repository.js";
import type { ListingPrimitives } from "../../domain/listing.js";
import { ListingRepository } from "../../domain/listing.repository.js";

export type FavoriteView = {
  favoritedAt: Date;
  /** false si l'annonce a été vendue, réservée, ou retirée depuis : le front la grise. */
  available: boolean;
  listing: ListingPrimitives;
};

@Injectable()
export class ListMyFavoritesUseCase {
  constructor(
    private readonly favorites: FavoriteRepository,
    private readonly listings: ListingRepository,
  ) {}

  async execute(userId: string, page: PageRequest): Promise<Page<FavoriteView>> {
    const { items, total } = await this.favorites.findByUser(userId, page);
    // Une seule requête pour toutes les annonces de la page.
    const listings = new Map((await this.listings.findByIds(items.map((f) => f.listingId))).map((l) => [l.id, l]));

    const views = items.flatMap((favorite) => {
      const listing = listings.get(favorite.listingId);
      // Annonce archivée ou repassée en brouillon : elle n'est plus visible, on ne la montre pas.
      if (!listing || !listing.isPublic) return [];
      return [{ favoritedAt: favorite.createdAt, available: listing.status === "published", listing: listing.toPrimitives() }];
    });
    return { items: views, page: page.page, limit: page.limit, total };
  }
}
