import { Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe } from "@nestjs/common";
import { RequirePermission } from "@identity";
import { AdminArchiveListingUseCase } from "./admin-archive-listing.use-case.js";

@Controller("admin/listings")
@RequirePermission("LISTINGS_MODERATE")
export class AdminArchiveListingController {
  constructor(private readonly useCase: AdminArchiveListingUseCase) {}

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  handle(@Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(id);
  }
}
