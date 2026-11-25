import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { CheckoutDto } from "./checkout.dto.js";
import { CheckoutUseCase } from "./checkout.use-case.js";

@Controller("checkout")
@UseGuards(JwtAuthGuard)
export class CheckoutController {
  constructor(private readonly useCase: CheckoutUseCase) {}

  @Post()
  handle(@CurrentUserId() userId: string, @Body() dto: CheckoutDto) {
    return this.useCase.execute(userId, dto.shippingAddress);
  }
}
