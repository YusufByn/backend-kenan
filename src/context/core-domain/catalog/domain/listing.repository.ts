import type { PageRequest } from "@core/http/pagination.js";
import type { Category, Condition, FrameSize, Listing, ListingStatus, WheelSize } from "./listing.js";
import { ListingNotFoundError } from "./listing.errors.js";

export const LISTING_SORTS = ["recent", "price_asc", "price_desc"] as const;
export type ListingSort = (typeof LISTING_SORTS)[number];

export type ListingSearch = {
  q?: string;
  category?: Category;
  brand?: string;
  frameSize?: FrameSize;
  wheelSize?: WheelSize;
  condition?: Condition;
  minPriceCents?: number;
  maxPriceCents?: number;
  sort: ListingSort;
  page: number;
  limit: number;
};

/** Port : stockage des annonces. */
export abstract class ListingRepository {
  abstract findById(id: string): Promise<Listing | null>;
  abstract findByIds(ids: string[]): Promise<Listing[]>;
  /** Annonces d'un vendeur, plus récentes d'abord, filtrées par statut si `status` est donné. */
  abstract findBySeller(
    sellerId: string,
    criteria: PageRequest & { status?: ListingStatus },
  ): Promise<{ items: Listing[]; total: number }>;
  /** Toutes les annonces publiées d'un vendeur (sans pagination : pour les retirer de la vente). */
  abstract findPublishedBySeller(sellerId: string): Promise<Listing[]>;
  /** Uniquement les annonces publiées. */
  abstract searchPublished(criteria: ListingSearch): Promise<{ items: Listing[]; total: number }>;
  /**
   * Tout ou rien. Si le statut d'une annonce a changé en base depuis sa lecture,
   * rien n'est enregistré et ListingConcurrentUpdateError est levée.
   */
  abstract saveAll(listings: Listing[]): Promise<void>;

  save(listing: Listing): Promise<void> {
    return this.saveAll([listing]);
  }

  async getById(id: string): Promise<Listing> {
    const listing = await this.findById(id);
    if (!listing) throw new ListingNotFoundError(id);
    return listing;
  }

  /** L'annonce d'un autre vendeur est traitée comme introuvable (404) : on ne révèle pas qu'elle existe. */
  async getOwnedBy(id: string, sellerId: string): Promise<Listing> {
    const listing = await this.findById(id);
    if (!listing || !listing.isOwnedBy(sellerId)) throw new ListingNotFoundError(id);
    return listing;
  }
}
