import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { OrderQueries } from "@ordering";
import { EventBus } from "@core/events/event-bus.js";
import { Review, type ReviewPrimitives } from "../../domain/review.js";
import { ReviewableOrderNotFoundError } from "../../domain/review.errors.js";
import { ReviewRepository } from "../../domain/review.repository.js";
import { ReviewCreated } from "../../public/events/review-events.js";

@Injectable()
export class CreateReviewUseCase {
  constructor(
    private readonly reviews: ReviewRepository,
    private readonly orders: OrderQueries,
    private readonly events: EventBus,
  ) {}

  async execute(buyerId: string, input: { orderId: string; rating: number; comment?: string }): Promise<ReviewPrimitives> {
    const order = await this.orders.findById(input.orderId);
    // La commande d'un autre est traitée comme introuvable.
    if (!order || order.buyerId !== buyerId) throw new ReviewableOrderNotFoundError(input.orderId);

    const review = Review.write({
      id: randomUUID(),
      order,
      buyerId,
      alreadyReviewed: await this.reviews.existsForOrder(order.id),
      rating: input.rating,
      comment: input.comment ?? "",
      now: new Date(),
    });
    await this.reviews.save(review);

    const saved = review.toPrimitives();
    this.events.publish(new ReviewCreated(saved.id, saved.sellerId, saved.buyerId, saved.rating));
    return saved;
  }
}
