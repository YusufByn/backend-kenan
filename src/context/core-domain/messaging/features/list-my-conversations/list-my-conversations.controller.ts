import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { withPage } from "@core/http/api-response.js";
import { PaginationQuery } from "@core/http/pagination.js";
import { ListMyConversationsUseCase } from "./list-my-conversations.use-case.js";

/** Lecture sans MESSAGE_SEND : un user rendu muet par la modération lit encore ses messages. */
@Controller("conversations")
@UseGuards(JwtAuthGuard)
export class ListMyConversationsController {
  constructor(private readonly useCase: ListMyConversationsUseCase) {}

  @Get()
  async handle(@CurrentUserId() userId: string, @Query() query: PaginationQuery) {
    return withPage(await this.useCase.execute(userId, query));
  }
}
