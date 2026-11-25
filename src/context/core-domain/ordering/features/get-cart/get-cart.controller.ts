import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { GetCartUseCase } from "./get-cart.use-case.js";

@Controller("cart")
@UseGuards(JwtAuthGuard)
export class GetCartController {
  constructor(private readonly useCase: GetCartUseCase) {}

  @Get()
  handle(@CurrentUserId() userId: string) {
    return this.useCase.execute(userId);
  }
}
