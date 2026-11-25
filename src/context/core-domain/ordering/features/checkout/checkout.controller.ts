import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { CheckoutDto } from "./checkout.dto.js";
import { CheckoutHandler } from "./checkout.handler.js";

@Controller("checkout")
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly handler: CheckoutHandler) {}

  @Post()
  handle(@CurrentUserId() userId: string, @Body() dto: CheckoutDto) {
    return this.handler.execute(userId, dto.shippingAddress);
  }
}
