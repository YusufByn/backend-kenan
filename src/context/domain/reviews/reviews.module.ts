import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IdentityModule } from "@identity";
import { OrderingModule } from "@ordering";
import { ReviewRepository } from "./domain/review.repository.js";
import { CreateReviewController } from "./features/create-review/create-review.controller.js";
import { CreateReviewHandler } from "./features/create-review/create-review.handler.js";
import { ListSellerReviewsController } from "./features/list-seller-reviews/list-seller-reviews.controller.js";
import { ListSellerReviewsHandler } from "./features/list-seller-reviews/list-seller-reviews.handler.js";
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
    CreateReviewHandler,
    ListSellerReviewsHandler,
    { provide: ReviewRepository, useClass: TypeOrmReviewRepository },
  ],
})
export class ReviewsModule {}
