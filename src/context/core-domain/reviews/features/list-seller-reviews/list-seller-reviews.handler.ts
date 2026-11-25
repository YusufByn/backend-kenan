import { Injectable } from "@nestjs/common";
import { UserQueries } from "@identity";
import { averageRating } from "../../domain/review.entity.js";
import { ReviewRepository } from "../../domain/review.repository.js";

export type SellerReviewsView = {
  sellerId: string;
  count: number;
  averageRating: number | null;
  items: { id: string; rating: number; comment: string; createdAt: Date; buyer: { id: string; name: string | null } }[];
};

@Injectable()
export class ListSellerReviewsHandler {
  constructor(
    private readonly reviews: ReviewRepository,
    private readonly users: UserQueries,
  ) {}

  async execute(sellerId: string): Promise<SellerReviewsView> {
    const reviews = await this.reviews.findBySeller(sellerId);
    const primitives = reviews.map((review) => review.toPrimitives());

    // Un seul appel par acheteur, même s'il a laissé plusieurs avis.
    const buyerIds = [...new Set(primitives.map((review) => review.buyerId))];
    const buyers = new Map(await Promise.all(buyerIds.map(async (id) => [id, await this.users.findById(id)] as const)));

    return {
      sellerId,
      count: reviews.length,
      averageRating: averageRating(reviews),
      items: primitives.map(({ id, rating, comment, createdAt, buyerId }) => ({
        id,
        rating,
        comment,
        createdAt,
        buyer: { id: buyerId, name: buyers.get(buyerId)?.name ?? null },
      })),
    };
  }
}
