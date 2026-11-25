import { Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { ArchiveListingUseCase } from "./archive-listing.use-case.js";

@Controller("listings")
@UseGuards(JwtAuthGuard)
export class ArchiveListingController {
  constructor(private readonly useCase: ArchiveListingUseCase) {}

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(userId, id);
  }
}
