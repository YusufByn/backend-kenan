import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { ListMyListingsUseCase } from "./list-my-listings.use-case.js";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class ListMyListingsController {
  constructor(private readonly useCase: ListMyListingsUseCase) {}

  @Get("listings")
  handle(@CurrentUserId() userId: string) {
    return this.useCase.execute(userId);
  }
}
