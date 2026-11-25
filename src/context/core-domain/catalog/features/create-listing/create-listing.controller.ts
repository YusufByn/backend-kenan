import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { CreateListingDto } from "./create-listing.dto.js";
import { CreateListingUseCase } from "./create-listing.use-case.js";

@Controller("listings")
@UseGuards(JwtAuthGuard)
export class CreateListingController {
  constructor(private readonly useCase: CreateListingUseCase) {}

  @Post()
  handle(@CurrentUserId() userId: string, @Body() dto: CreateListingDto) {
    return this.useCase.execute(userId, dto);
  }
}
