import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { CancelOrderHandler } from "./cancel-order.handler.js";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class CancelOrderController {
  constructor(private readonly handler: CancelOrderHandler) {}

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.handler.execute(userId, id);
  }
}
