import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { ListSellerReviewsHandler } from "./list-seller-reviews.handler.js";

@Controller("sellers")
export class ListSellerReviewsController {
  constructor(private readonly handler: ListSellerReviewsHandler) {}

  @Get(":id/reviews")
  handle(@Param("id", ParseUUIDPipe) sellerId: string) {
    return this.handler.execute(sellerId);
  }
}
