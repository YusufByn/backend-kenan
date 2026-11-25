import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { ListMyOrdersUseCase } from "./list-my-orders.use-case.js";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class ListMyOrdersController {
  constructor(private readonly useCase: ListMyOrdersUseCase) {}

  @Get()
  handle(@CurrentUserId() userId: string) {
    return this.useCase.execute(userId);
  }
}
