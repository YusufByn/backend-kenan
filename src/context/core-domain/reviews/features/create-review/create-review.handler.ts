import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { OrderQueries } from "@ordering";
import { Review, type ReviewPrimitives } from "../../domain/review.entity.js";
import { ReviewableOrderNotFoundError } from "../../domain/review.errors.js";
import { ReviewRepository } from "../../domain/review.repository.js";

@Injectable()
export class CreateReviewHandler {
  constructor(
    private readonly reviews: ReviewRepository,
    private readonly orders: OrderQueries,
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
    return review.toPrimitives();
  }
}
