import { Body, Controller, Post } from "@nestjs/common";
import { CurrentUserId, RequirePermission } from "@identity";
import { CreateListingDto } from "./create-listing.dto.js";
import { CreateListingUseCase } from "./create-listing.use-case.js";

@Controller("listings")
@RequirePermission("LISTING_SELL")
export class CreateListingController {
  constructor(private readonly useCase: CreateListingUseCase) {}

  @Post()
  handle(@CurrentUserId() userId: string, @Body() dto: CreateListingDto) {
    return this.useCase.execute(userId, dto);
  }
}
