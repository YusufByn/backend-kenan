import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { PublishListingHandler } from "./publish-listing.handler.js";

@Controller("listings")
@UseGuards(JwtAuthGuard)
export class PublishListingController {
  constructor(private readonly handler: PublishListingHandler) {}

  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.handler.execute(userId, id);
  }
}
