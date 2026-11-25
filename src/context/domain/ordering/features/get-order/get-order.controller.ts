import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { GetOrderHandler } from "./get-order.handler.js";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class GetOrderController {
  constructor(private readonly handler: GetOrderHandler) {}

  @Get(":id")
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.handler.execute(userId, id);
  }
}
