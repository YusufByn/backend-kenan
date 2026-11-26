import { Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe } from "@nestjs/common";
import { CurrentUserId, RequirePermission } from "@identity";
import { AdminRemoveReviewUseCase } from "./admin-remove-review.use-case.js";

@Controller("admin/reviews")
@RequirePermission("REVIEWS_MODERATE")
export class AdminRemoveReviewController {
  constructor(private readonly useCase: AdminRemoveReviewUseCase) {}

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() moderatorId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(moderatorId, id);
  }
}
