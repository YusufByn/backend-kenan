import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Put, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { AddFavoriteUseCase } from "./add-favorite.use-case.js";

/** PUT et pas POST : idempotent, l'appeler deux fois laisse un seul favori. */
@Controller("listings")
@UseGuards(JwtAuthGuard)
export class AddFavoriteController {
  constructor(private readonly useCase: AddFavoriteUseCase) {}

  @Put(":id/favorite")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(userId, id);
  }
}
