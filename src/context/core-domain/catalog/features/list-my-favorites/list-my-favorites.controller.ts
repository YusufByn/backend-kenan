import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { withPage } from "@core/http/api-response.js";
import { PaginationQuery } from "@core/http/pagination.js";
import { ListMyFavoritesUseCase } from "./list-my-favorites.use-case.js";

@Controller("me/favorites")
@UseGuards(JwtAuthGuard)
export class ListMyFavoritesController {
  constructor(private readonly useCase: ListMyFavoritesUseCase) {}

  @Get()
  async handle(@CurrentUserId() userId: string, @Query() query: PaginationQuery) {
    return withPage(await this.useCase.execute(userId, query));
  }
}
