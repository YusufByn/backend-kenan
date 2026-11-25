import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { PayOrderUseCase } from "./pay-order.use-case.js";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class PayOrderController {
  constructor(private readonly useCase: PayOrderUseCase) {}

  @Post(":id/pay")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(userId, id);
  }
}
