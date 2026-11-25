import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { ListMySalesHandler } from "./list-my-sales.handler.js";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class ListMySalesController {
  constructor(private readonly handler: ListMySalesHandler) {}

  @Get("sales")
  handle(@CurrentUserId() userId: string) {
    return this.handler.execute(userId);
  }
}
