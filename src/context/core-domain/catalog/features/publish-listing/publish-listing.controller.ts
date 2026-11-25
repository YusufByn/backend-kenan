import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { PublishListingUseCase } from "./publish-listing.use-case.js";

@Controller("listings")
@UseGuards(JwtAuthGuard)
export class PublishListingController {
  constructor(private readonly useCase: PublishListingUseCase) {}

  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(userId, id);
  }
}
