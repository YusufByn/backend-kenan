import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, type Repository } from "typeorm";
import { isUniqueViolation } from "@core/database/is-unique-violation.js";
import { offsetOf, type PageRequest } from "@core/http/pagination.js";
import { Review } from "../domain/review.js";
import { ReviewAlreadyExistsError } from "../domain/review.errors.js";
import { ReviewRepository, type SellerRatingStats } from "../domain/review.repository.js";
import { ReviewOrmEntity } from "./review.orm-entity.js";

@Injectable()
export class TypeOrmReviewRepository extends ReviewRepository {
  constructor(
    @InjectRepository(ReviewOrmEntity)
    private readonly orm: Repository<ReviewOrmEntity>,
  ) {
    super();
  }

  async findById(id: string): Promise<Review | null> {
    const row = await this.orm.findOneBy({ id });
    return row ? Review.restore(row) : null;
  }

  existsForOrder(orderId: string): Promise<boolean> {
    return this.orm.existsBy({ orderId });
  }

  async findBySeller(sellerId: string, page: PageRequest): Promise<{ items: Review[]; total: number }> {
    const [rows, total] = await this.orm.findAndCount({
      where: { sellerId, removedAt: IsNull() },
      order: { createdAt: "DESC", id: "ASC" },
      skip: offsetOf(page),
      take: page.limit,
    });
    return { items: rows.map((row) => Review.restore(row)), total };
  }

  async statsForSeller(sellerId: string): Promise<SellerRatingStats> {
    // Un GROUP BY : la base compte, on ne charge aucun avis en mémoire.
    const rows: { rating: number; count: number }[] = await this.orm
      .createQueryBuilder("r")
      .select("r.rating", "rating")
      .addSelect("COUNT(*)", "count")
      .where("r.sellerId = :sellerId AND r.removedAt IS NULL", { sellerId })
      .groupBy("r.rating")
      .getRawMany();

    const distribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
    let count = 0;
    let sum = 0;
    for (const row of rows) {
      const n = Number(row.count);
      distribution[String(row.rating) as keyof typeof distribution] = n;
      count += n;
      sum += Number(row.rating) * n;
    }
    return { count, average: count === 0 ? null : Math.round((sum / count) * 10) / 10, distribution };
  }

  async save(review: Review): Promise<void> {
    try {
      await this.orm.save(this.orm.create(review.toPrimitives()));
    } catch (error) {
      // Deux avis envoyés en même temps pour la même commande : l'index unique sur orderId tranche.
      if (isUniqueViolation(error)) throw new ReviewAlreadyExistsError();
      throw error;
    }
  }
}
