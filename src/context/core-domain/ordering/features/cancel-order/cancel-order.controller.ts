import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { CancelOrderUseCase } from "./cancel-order.use-case.js";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class CancelOrderController {
  constructor(private readonly useCase: CancelOrderUseCase) {}

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(userId, id);
  }
}
