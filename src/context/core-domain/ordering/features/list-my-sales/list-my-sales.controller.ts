import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { withPage } from "@core/http/api-response.js";
import { ListMySalesQuery } from "./list-my-sales.query.js";
import { ListMySalesUseCase } from "./list-my-sales.use-case.js";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class ListMySalesController {
  constructor(private readonly useCase: ListMySalesUseCase) {}

  @Get("sales")
  async handle(@CurrentUserId() userId: string, @Query() query: ListMySalesQuery) {
    return withPage(await this.useCase.execute(userId, query));
  }
}
