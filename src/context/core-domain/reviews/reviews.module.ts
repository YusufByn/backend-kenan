import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { IdentityModule } from "@identity";
import { OrderingModule } from "@ordering";
import { ReviewRepository } from "./domain/review.repository.js";
import { AdminRemoveReviewController } from "./features/admin-remove-review/admin-remove-review.controller.js";
import { AdminRemoveReviewUseCase } from "./features/admin-remove-review/admin-remove-review.use-case.js";
import { CreateReviewController } from "./features/create-review/create-review.controller.js";
import { CreateReviewUseCase } from "./features/create-review/create-review.use-case.js";
import { ListSellerReviewsController } from "./features/list-seller-reviews/list-seller-reviews.controller.js";
import { ListSellerReviewsUseCase } from "./features/list-seller-reviews/list-seller-reviews.use-case.js";
import { ReplyToReviewController } from "./features/reply-to-review/reply-to-review.controller.js";
import { ReplyToReviewUseCase } from "./features/reply-to-review/reply-to-review.use-case.js";
import { ReviewOrmEntity } from "./infrastructure/review.orm-entity.js";
import { TypeOrmReviewRepository } from "./infrastructure/typeorm-review.repository.js";

@Module({
  imports: [
    TypeOrmModule.forFeature([ReviewOrmEntity]),
    IdentityModule, // JwtAuthGuard, RequirePermission, UserQueries (nom de l'acheteur)
    OrderingModule, // OrderQueries (commande livrée ?)
  ],
  controllers: [CreateReviewController, ListSellerReviewsController, ReplyToReviewController, AdminRemoveReviewController],
  providers: [
    CreateReviewUseCase,
    ListSellerReviewsUseCase,
    ReplyToReviewUseCase,
    AdminRemoveReviewUseCase,
    { provide: ReviewRepository, useClass: TypeOrmReviewRepository },
  ],
})
export class ReviewsModule {}
