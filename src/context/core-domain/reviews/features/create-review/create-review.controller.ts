import { Body, Controller, Post } from "@nestjs/common";
import { CurrentUserId, RequirePermission } from "@identity";
import { CreateReviewDto } from "./create-review.dto.js";
import { CreateReviewUseCase } from "./create-review.use-case.js";

@Controller("reviews")
@RequirePermission("REVIEW_CREATE")
export class CreateReviewController {
  constructor(private readonly useCase: CreateReviewUseCase) {}

  @Post()
  handle(@CurrentUserId() userId: string, @Body() dto: CreateReviewDto) {
    return this.useCase.execute(userId, dto);
  }
}
