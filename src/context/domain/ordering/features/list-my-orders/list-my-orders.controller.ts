import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { ListMyOrdersHandler } from "./list-my-orders.handler.js";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class ListMyOrdersController {
  constructor(private readonly handler: ListMyOrdersHandler) {}

  @Get()
  handle(@CurrentUserId() userId: string) {
    return this.handler.execute(userId);
  }
}
