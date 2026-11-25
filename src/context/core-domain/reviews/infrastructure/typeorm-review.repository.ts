import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { isUniqueViolation } from "@core/database/is-unique-violation.js";
import { Review } from "../domain/review.entity.js";
import { ReviewAlreadyExistsError } from "../domain/review.errors.js";
import { ReviewRepository } from "../domain/review.repository.js";
import { ReviewOrmEntity } from "./review.orm-entity.js";

@Injectable()
export class TypeOrmReviewRepository extends ReviewRepository {
  constructor(
    @InjectRepository(ReviewOrmEntity)
    private readonly orm: Repository<ReviewOrmEntity>,
  ) {
    super();
  }

  existsForOrder(orderId: string): Promise<boolean> {
    return this.orm.existsBy({ orderId });
  }

  async findBySeller(sellerId: string): Promise<Review[]> {
    const rows = await this.orm.find({ where: { sellerId }, order: { createdAt: "DESC" } });
    return rows.map((row) => Review.restore(row));
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
