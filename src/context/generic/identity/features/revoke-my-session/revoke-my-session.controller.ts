import { Controller, Delete, HttpCode, HttpStatus, Param, ParseUUIDPipe, UseGuards } from "@nestjs/common";
import { CurrentUserId } from "../../public/current-user-id.decorator.js";
import { JwtAuthGuard } from "../../public/jwt-auth.guard.js";
import { RevokeMySessionUseCase } from "./revoke-my-session.use-case.js";

@Controller("me/sessions")
@UseGuards(JwtAuthGuard)
export class RevokeMySessionController {
  constructor(private readonly useCase: RevokeMySessionUseCase) {}

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(userId, id);
  }
}
