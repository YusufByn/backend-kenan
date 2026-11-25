import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { CurrentUserId, RequirePermission } from "@identity";
import { PublishListingUseCase } from "./publish-listing.use-case.js";

@Controller("listings")
@RequirePermission("LISTING_SELL")
export class PublishListingController {
  constructor(private readonly useCase: PublishListingUseCase) {}

  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(userId, id);
  }
}
