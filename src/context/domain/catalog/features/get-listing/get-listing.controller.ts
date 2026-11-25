import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { GetListingHandler } from "./get-listing.handler.js";

@Controller("listings")
export class GetListingController {
  constructor(private readonly handler: GetListingHandler) {}

  @Get(":id")
  handle(@Param("id", ParseUUIDPipe) id: string) {
    return this.handler.execute(id);
  }
}
