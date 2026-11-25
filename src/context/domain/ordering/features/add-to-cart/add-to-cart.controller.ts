import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { AddToCartDto } from "./add-to-cart.dto.js";
import { AddToCartHandler } from "./add-to-cart.handler.js";

@Controller("cart/items")
@UseGuards(JwtAuthGuard)
export class AddToCartController {
  constructor(private readonly handler: AddToCartHandler) {}

  /** data: null : le client relit GET /cart pour afficher le panier à jour. */
  @Post()
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Body() dto: AddToCartDto) {
    return this.handler.execute(userId, dto.listingId);
  }
}
