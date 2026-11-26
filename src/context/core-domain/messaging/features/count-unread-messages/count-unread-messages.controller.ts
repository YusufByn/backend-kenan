import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { CountUnreadMessagesUseCase } from "./count-unread-messages.use-case.js";

@Controller("conversations")
@UseGuards(JwtAuthGuard)
export class CountUnreadMessagesController {
  constructor(private readonly useCase: CountUnreadMessagesUseCase) {}

  /** Déclaré avant GET /conversations/:id/... : "unread-count" n'est pas un UUID de toute façon. */
  @Get("unread-count")
  handle(@CurrentUserId() userId: string) {
    return this.useCase.execute(userId);
  }
}
