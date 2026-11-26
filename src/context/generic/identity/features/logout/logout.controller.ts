import { Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { CurrentSessionId } from "../../public/current-session-id.decorator.js";
import { CurrentUserId } from "../../public/current-user-id.decorator.js";
import { JwtAuthGuard } from "../../public/jwt-auth.guard.js";
import { LogoutUseCase } from "./logout.use-case.js";

@Controller("auth")
@UseGuards(JwtAuthGuard)
export class LogoutController {
  constructor(private readonly useCase: LogoutUseCase) {}

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @CurrentSessionId() sessionId: string) {
    return this.useCase.execute(userId, sessionId);
  }
}
