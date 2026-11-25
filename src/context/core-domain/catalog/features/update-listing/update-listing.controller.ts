import { Body, Controller, Param, ParseUUIDPipe, Patch } from "@nestjs/common";
import { CurrentUserId, RequirePermission } from "@identity";
import { UpdateListingDto } from "./update-listing.dto.js";
import { UpdateListingUseCase } from "./update-listing.use-case.js";

@Controller("listings")
@RequirePermission("LISTING_SELL")
export class UpdateListingController {
  constructor(private readonly useCase: UpdateListingUseCase) {}

  @Patch(":id")
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateListingDto) {
    return this.useCase.execute(userId, id, dto);
  }
}
