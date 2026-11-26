import { Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { RemoveFavoriteUseCase } from "./remove-favorite.use-case.js";

@Controller("listings")
@UseGuards(JwtAuthGuard)
export class RemoveFavoriteController {
  constructor(private readonly useCase: RemoveFavoriteUseCase) {}

  @Delete(":id/favorite")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(userId, id);
  }
}
