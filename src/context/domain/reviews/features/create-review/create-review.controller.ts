import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { CreateReviewDto } from "./create-review.dto.js";
import { CreateReviewHandler } from "./create-review.handler.js";

@Controller("reviews")
@UseGuards(JwtAuthGuard)
export class CreateReviewController {
  constructor(private readonly handler: CreateReviewHandler) {}

  @Post()
  handle(@CurrentUserId() userId: string, @Body() dto: CreateReviewDto) {
    return this.handler.execute(userId, dto);
  }
}
