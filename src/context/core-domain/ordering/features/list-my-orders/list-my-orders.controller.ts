import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { withPage } from "@core/http/api-response.js";
import { ListMyOrdersQuery } from "./list-my-orders.query.js";
import { ListMyOrdersUseCase } from "./list-my-orders.use-case.js";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class ListMyOrdersController {
  constructor(private readonly useCase: ListMyOrdersUseCase) {}

  @Get()
  async handle(@CurrentUserId() userId: string, @Query() query: ListMyOrdersQuery) {
    return withPage(await this.useCase.execute(userId, query));
  }
}
