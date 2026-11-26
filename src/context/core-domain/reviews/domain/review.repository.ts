import type { PageRequest } from "@core/http/pagination.js";
import type { Review } from "./review.js";
import { ReviewNotFoundError } from "./review.errors.js";

/** Note moyenne et répartition, calculées sur tous les avis visibles (pas seulement la page affichée). */
export type SellerRatingStats = {
  count: number;
  /** Arrondie à 0,1 près, null sans avis. */
  average: number | null;
  /** Nombre d'avis par note : { "5": 12, "4": 3, ... } */
  distribution: Record<"1" | "2" | "3" | "4" | "5", number>;
};

/** Port : stockage des avis. Les avis retirés par la modération sont exclus des lectures publiques. */
export abstract class ReviewRepository {
  abstract findById(id: string): Promise<Review | null>;
  /** Compte aussi les avis retirés : un avis retiré ne permet pas d'en écrire un nouveau. */
  abstract existsForOrder(orderId: string): Promise<boolean>;
  /** Avis visibles, plus récents d'abord. */
  abstract findBySeller(sellerId: string, page: PageRequest): Promise<{ items: Review[]; total: number }>;
  abstract statsForSeller(sellerId: string): Promise<SellerRatingStats>;
  abstract save(review: Review): Promise<void>;

  async getById(id: string): Promise<Review> {
    const review = await this.findById(id);
    if (!review || review.isRemoved) throw new ReviewNotFoundError(id);
    return review;
  }
}
