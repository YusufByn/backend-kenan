import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { RefreshSessionDto } from "./refresh-session.dto.js";
import { RefreshSessionUseCase } from "./refresh-session.use-case.js";

/** Public : c'est justement quand l'access token a expiré qu'on l'appelle. */
@Controller("auth")
export class RefreshSessionController {
  constructor(private readonly useCase: RefreshSessionUseCase) {}

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  handle(@Body() dto: RefreshSessionDto) {
    return this.useCase.execute(dto.refreshToken);
  }
}
