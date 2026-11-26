import type { PageRequest } from "@core/http/pagination.js";

/** Une annonce mise en favori par un user. Pas d'entité : c'est une simple relation, sans règle propre. */
export type Favorite = { userId: string; listingId: string; createdAt: Date };

/** Port : stockage des favoris. */
export abstract class FavoriteRepository {
  /** Idempotent : remettre en favori une annonce déjà en favori ne change rien. */
  abstract add(favorite: Favorite): Promise<void>;
  /** Idempotent. */
  abstract remove(userId: string, listingId: string): Promise<void>;
  /** Plus récents d'abord. */
  abstract findByUser(userId: string, page: PageRequest): Promise<{ items: Favorite[]; total: number }>;
  /** Les users qui suivent cette annonce : prévenus d'une baisse de prix. */
  abstract findUserIdsByListing(listingId: string): Promise<string[]>;
  abstract countByListing(listingId: string): Promise<number>;
}
