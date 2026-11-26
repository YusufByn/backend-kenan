import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { withPage } from "@core/http/api-response.js";
import { ListMyListingsQuery } from "./list-my-listings.query.js";
import { ListMyListingsUseCase } from "./list-my-listings.use-case.js";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class ListMyListingsController {
  constructor(private readonly useCase: ListMyListingsUseCase) {}

  @Get("listings")
  async handle(@CurrentUserId() userId: string, @Query() query: ListMyListingsQuery) {
    return withPage(await this.useCase.execute(userId, query));
  }
}
