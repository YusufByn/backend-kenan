import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { CreateReviewDto } from "./create-review.dto.js";
import { CreateReviewUseCase } from "./create-review.use-case.js";

@Controller("reviews")
@UseGuards(JwtAuthGuard)
export class CreateReviewController {
  constructor(private readonly useCase: CreateReviewUseCase) {}

  @Post()
  handle(@CurrentUserId() userId: string, @Body() dto: CreateReviewDto) {
    return this.useCase.execute(userId, dto);
  }
}
