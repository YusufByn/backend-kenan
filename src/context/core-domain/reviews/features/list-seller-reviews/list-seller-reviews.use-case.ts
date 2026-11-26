import { Injectable } from "@nestjs/common";
import { UserQueries } from "@identity";
import type { PageRequest } from "@core/http/pagination.js";
import { ReviewRepository, type SellerRatingStats } from "../../domain/review.repository.js";

export type SellerReviewView = {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date;
  buyer: { id: string; name: string | null };
  sellerReply: string | null;
  repliedAt: Date | null;
};

/** Une page d'avis + les stats du vendeur, calculées sur tous ses avis. */
export type SellerReviewsPage = {
  items: SellerReviewView[];
  page: number;
  limit: number;
  total: number;
  stats: SellerRatingStats;
};

@Injectable()
export class ListSellerReviewsUseCase {
  constructor(
    private readonly reviews: ReviewRepository,
    private readonly users: UserQueries,
  ) {}

  async execute(sellerId: string, page: PageRequest): Promise<SellerReviewsPage> {
    const [{ items, total }, stats] = await Promise.all([
      this.reviews.findBySeller(sellerId, page),
      this.reviews.statsForSeller(sellerId),
    ]);
    const primitives = items.map((review) => review.toPrimitives());

    // Un seul appel par acheteur, même s'il a laissé plusieurs avis.
    const buyerIds = [...new Set(primitives.map((review) => review.buyerId))];
    const buyers = new Map(await Promise.all(buyerIds.map(async (id) => [id, await this.users.findById(id)] as const)));

    return {
      items: primitives.map(({ id, rating, comment, createdAt, buyerId, sellerReply, repliedAt }) => ({
        id,
        rating,
        comment,
        createdAt,
        buyer: { id: buyerId, name: buyers.get(buyerId)?.name ?? null },
        sellerReply,
        repliedAt,
      })),
      page: page.page,
      limit: page.limit,
      total,
      stats,
    };
  }
}
