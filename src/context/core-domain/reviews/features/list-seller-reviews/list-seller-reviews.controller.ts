import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { ListSellerReviewsUseCase } from "./list-seller-reviews.use-case.js";

@Controller("sellers")
export class ListSellerReviewsController {
  constructor(private readonly useCase: ListSellerReviewsUseCase) {}

  @Get(":id/reviews")
  handle(@Param("id", ParseUUIDPipe) sellerId: string) {
    return this.useCase.execute(sellerId);
  }
}
