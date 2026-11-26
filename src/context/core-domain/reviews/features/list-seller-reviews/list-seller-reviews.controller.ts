import { Controller, Get, Param, ParseUUIDPipe, Query } from "@nestjs/common";
import { withMeta } from "@core/http/api-response.js";
import { PaginationQuery } from "@core/http/pagination.js";
import { ListSellerReviewsUseCase } from "./list-seller-reviews.use-case.js";

@Controller("sellers")
export class ListSellerReviewsController {
  constructor(private readonly useCase: ListSellerReviewsUseCase) {}

  /** data = les avis de la page ; meta = pagination + stats (moyenne et répartition sur tous les avis). */
  @Get(":id/reviews")
  async handle(@Param("id", ParseUUIDPipe) sellerId: string, @Query() query: PaginationQuery) {
    const { items, stats, page, limit, total } = await this.useCase.execute(sellerId, query);
    return withMeta(items, { page, limit, total, totalPages: Math.ceil(total / limit), stats });
  }
}
