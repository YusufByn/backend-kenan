import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { CreateListingDto } from "./create-listing.dto.js";
import { CreateListingHandler } from "./create-listing.handler.js";

@Controller("listings")
@UseGuards(JwtAuthGuard)
export class CreateListingController {
  constructor(private readonly handler: CreateListingHandler) {}

  @Post()
  handle(@CurrentUserId() userId: string, @Body() dto: CreateListingDto) {
    return this.handler.execute(userId, dto);
  }
}
