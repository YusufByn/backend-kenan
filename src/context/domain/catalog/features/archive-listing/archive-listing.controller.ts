import { Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { ArchiveListingHandler } from "./archive-listing.handler.js";

@Controller("listings")
@UseGuards(JwtAuthGuard)
export class ArchiveListingController {
  constructor(private readonly handler: ArchiveListingHandler) {}

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.handler.execute(userId, id);
  }
}
