import { Body, Controller, Post } from "@nestjs/common";
import { CurrentUserId, RequirePermission } from "@identity";
import { StartConversationDto } from "./start-conversation.dto.js";
import { StartConversationUseCase } from "./start-conversation.use-case.js";

@Controller("conversations")
@RequirePermission("MESSAGE_SEND")
export class StartConversationController {
  constructor(private readonly useCase: StartConversationUseCase) {}

  @Post()
  handle(@CurrentUserId() userId: string, @Body() dto: StartConversationDto) {
    return this.useCase.execute(userId, dto);
  }
}
