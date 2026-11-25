import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IdentityModule } from "@identity";
import { OrderingModule } from "@ordering";
import { ReviewRepository } from "./domain/review.repository.js";
import { CreateReviewController } from "./features/create-review/create-review.controller.js";
import { CreateReviewUseCase } from "./features/create-review/create-review.use-case.js";
import { ListSellerReviewsController } from "./features/list-seller-reviews/list-seller-reviews.controller.js";
import { ListSellerReviewsUseCase } from "./features/list-seller-reviews/list-seller-reviews.use-case.js";
import { ReviewOrmEntity } from "./infrastructure/review.orm-entity.js";
import { TypeOrmReviewRepository } from "./infrastructure/typeorm-review.repository.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewOrmEntity]),
    IdentityModule, // JwtAuthGuard, UserQueries (nom de l'acheteur)
    OrderingModule, // OrderQueries (commande livrée ?)
  ],
  controllers: [CreateReviewController, ListSellerReviewsController],
  providers: [
    CreateReviewUseCase,
    ListSellerReviewsUseCase,
    { provide: ReviewRepository, useClass: TypeOrmReviewRepository },
  ],
})
export class ReviewsModule {}
