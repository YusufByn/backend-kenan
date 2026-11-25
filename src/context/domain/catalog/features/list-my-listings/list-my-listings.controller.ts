import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { ListMyListingsHandler } from "./list-my-listings.handler.js";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class ListMyListingsController {
  constructor(private readonly handler: ListMyListingsHandler) {}

  @Get("listings")
  handle(@CurrentUserId() userId: string) {
    return this.handler.execute(userId);
  }
}
