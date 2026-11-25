import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { GetListingUseCase } from "./get-listing.use-case.js";

@Controller("listings")
export class GetListingController {
  constructor(private readonly useCase: GetListingUseCase) {}

  @Get(":id")
  handle(@Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(id);
  }
}
