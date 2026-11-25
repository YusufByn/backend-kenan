import { Body, Controller, Post } from "@nestjs/common";
import { CurrentUserId, RequirePermission } from "@identity";
import { CheckoutDto } from "./checkout.dto.js";
import { CheckoutUseCase } from "./checkout.use-case.js";

@Controller("checkout")
@RequirePermission("ORDER_PLACE")
export class CheckoutController {
  constructor(private readonly useCase: CheckoutUseCase) {}

  @Post()
  handle(@CurrentUserId() userId: string, @Body() dto: CheckoutDto) {
    return this.useCase.execute(userId, dto.shippingAddress);
  }
}
