import { Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { RemoveFromCartUseCase } from "./remove-from-cart.use-case.js";

@Controller("cart/items")
@UseGuards(JwtAuthGuard)
export class RemoveFromCartController {
  constructor(private readonly useCase: RemoveFromCartUseCase) {}

  @Delete(":listingId")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("listingId", ParseUUIDPipe) listingId: string) {
    return this.useCase.execute(userId, listingId);
  }
}
