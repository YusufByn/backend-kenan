import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { GetCartHandler } from "./get-cart.handler.js";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class GetCartController {
  constructor(private readonly handler: GetCartHandler) {}

  @Get()
  handle(@CurrentUserId() userId: string) {
    return this.handler.execute(userId);
  }
}
