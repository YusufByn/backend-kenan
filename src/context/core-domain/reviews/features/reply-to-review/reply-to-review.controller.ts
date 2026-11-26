import { Body, Controller, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { ReplyToReviewDto } from "./reply-to-review.dto.js";
import { ReplyToReviewUseCase } from "./reply-to-review.use-case.js";

@Controller("reviews")
@UseGuards(JwtAuthGuard)
export class ReplyToReviewController {
  constructor(private readonly useCase: ReplyToReviewUseCase) {}

  @Post(":id/reply")
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string, @Body() dto: ReplyToReviewDto) {
    return this.useCase.execute(userId, id, dto);
  }
}
