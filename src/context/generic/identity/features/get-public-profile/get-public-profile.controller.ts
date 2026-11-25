import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { GetPublicProfileUseCase } from "./get-public-profile.use-case.js";

@Controller("users")
export class GetPublicProfileController {
  constructor(private readonly useCase: GetPublicProfileUseCase) {}

  @Get(":id")
  handle(@Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(id);
  }
}
