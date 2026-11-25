import type { Review } from "./review.js";

/** Port : stockage des avis. */
export abstract class ReviewRepository {
  abstract existsForOrder(orderId: string): Promise<boolean>;
  /** Plus récents d'abord. */
  abstract findBySeller(sellerId: string): Promise<Review[]>;
  abstract save(review: Review): Promise<void>;
}
