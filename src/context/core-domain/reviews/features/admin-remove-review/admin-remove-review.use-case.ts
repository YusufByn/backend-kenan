import { Injectable, Logger } from "@nestjs/common";
import { ReviewRepository } from "../../domain/review.repository.js";

/**
 * Avis abusif (insultes, faux avis) : il disparaît de la fiche du vendeur et de sa moyenne.
 * Pas supprimé en base : l'acheteur ne peut pas en reposter un pour la même commande.
 */
@Injectable()
export class AdminRemoveReviewUseCase {
  private readonly logger = new Logger("AdminRemoveReview");

  constructor(private readonly reviews: ReviewRepository) {}

  async execute(moderatorId: string, reviewId: string): Promise<void> {
    const review = await this.reviews.getById(reviewId);
    review.remove(new Date());
    await this.reviews.save(review);
    this.logger.log(`Avis ${reviewId} retiré par ${moderatorId}`);
  }
}
