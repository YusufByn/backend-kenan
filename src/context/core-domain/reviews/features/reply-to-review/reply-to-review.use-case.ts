import { Injectable } from "@nestjs/common";
import { EventBus } from "@core/events/event-bus.js";
import type { ReviewPrimitives } from "../../domain/review.js";
import { ReviewRepository } from "../../domain/review.repository.js";
import { ReviewReplied } from "../../public/events/review-events.js";

/** Droit de réponse du vendeur : une réponse publique, une seule fois. */
@Injectable()
export class ReplyToReviewUseCase {
  constructor(
    private readonly reviews: ReviewRepository,
    private readonly events: EventBus,
  ) {}

  async execute(sellerId: string, reviewId: string, input: { reply: string }): Promise<ReviewPrimitives> {
    const review = await this.reviews.getById(reviewId);
    review.reply(sellerId, input.reply, new Date());
    await this.reviews.save(review);

    const saved = review.toPrimitives();
    this.events.publish(new ReviewReplied(saved.id, saved.sellerId, saved.buyerId));
    return saved;
  }
}
