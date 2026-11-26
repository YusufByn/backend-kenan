import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentSessionId } from "../../public/current-session-id.decorator.js";
import { CurrentUserId } from "../../public/current-user-id.decorator.js";
import { JwtAuthGuard } from "../../public/jwt-auth.guard.js";
import { ListMySessionsUseCase } from "./list-my-sessions.use-case.js";

@Controller("me/sessions")
@UseGuards(JwtAuthGuard)
export class ListMySessionsController {
  constructor(private readonly useCase: ListMySessionsUseCase) {}

  @Get()
  handle(@CurrentUserId() userId: string, @CurrentSessionId() sessionId: string) {
    return this.useCase.execute(userId, sessionId);
  }
}
