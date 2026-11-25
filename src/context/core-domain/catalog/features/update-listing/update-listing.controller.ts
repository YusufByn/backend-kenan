import { Body, Controller, Param, ParseUUIDPipe, Patch, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { UpdateListingDto } from "./update-listing.dto.js";
import { UpdateListingHandler } from "./update-listing.handler.js";

@Controller("listings")
@UseGuards(JwtAuthGuard)
export class UpdateListingController {
  constructor(private readonly handler: UpdateListingHandler) {}

  @Patch(":id")
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateListingDto) {
    return this.handler.execute(userId, id, dto);
  }
}
