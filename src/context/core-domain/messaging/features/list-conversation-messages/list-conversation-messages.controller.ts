import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { withPage } from "@core/http/api-response.js";
import { PaginationQuery } from "@core/http/pagination.js";
import { ListConversationMessagesUseCase } from "./list-conversation-messages.use-case.js";

@Controller("conversations")
@UseGuards(JwtAuthGuard)
export class ListConversationMessagesController {
  constructor(private readonly useCase: ListConversationMessagesUseCase) {}

  @Get(":id/messages")
  async handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string, @Query() query: PaginationQuery) {
    return withPage(await this.useCase.execute(userId, id, query));
  }
}
