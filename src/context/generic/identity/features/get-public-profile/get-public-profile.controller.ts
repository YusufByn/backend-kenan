import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { GetPublicProfileHandler } from "./get-public-profile.handler.js";

@Controller("users")
export class GetPublicProfileController {
  constructor(private readonly handler: GetPublicProfileHandler) {}

  @Get(":id")
  handle(@Param("id", ParseUUIDPipe) id: string) {
    return this.handler.execute(id);
  }
}
