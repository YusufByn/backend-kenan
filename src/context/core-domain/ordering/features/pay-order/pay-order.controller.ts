import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { PayOrderHandler } from "./pay-order.handler.js";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class PayOrderController {
  constructor(private readonly handler: PayOrderHandler) {}

  @Post(":id/pay")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.handler.execute(userId, id);
  }
}
