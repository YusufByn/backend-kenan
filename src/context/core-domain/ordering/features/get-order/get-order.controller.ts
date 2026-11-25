import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { GetOrderUseCase } from "./get-order.use-case.js";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class GetOrderController {
  constructor(private readonly useCase: GetOrderUseCase) {}

  @Get(":id")
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(userId, id);
  }
}
