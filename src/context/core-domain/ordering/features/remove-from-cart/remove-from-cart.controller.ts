import { Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { RemoveFromCartHandler } from "./remove-from-cart.handler.js";

@Controller("cart/items")
@UseGuards(JwtAuthGuard)
export class RemoveFromCartController {
  constructor(private readonly handler: RemoveFromCartHandler) {}

  @Delete(":listingId")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("listingId", ParseUUIDPipe) listingId: string) {
    return this.handler.execute(userId, listingId);
  }
}
