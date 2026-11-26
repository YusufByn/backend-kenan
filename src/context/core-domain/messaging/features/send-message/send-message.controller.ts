import { Body, Controller, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { CurrentUserId, RequirePermission } from "@identity";
import { SendMessageDto } from "./send-message.dto.js";
import { SendMessageUseCase } from "./send-message.use-case.js";

@Controller("conversations")
@RequirePermission("MESSAGE_SEND")
export class SendMessageController {
  constructor(private readonly useCase: SendMessageUseCase) {}

  @Post(":id/messages")
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string, @Body() dto: SendMessageDto) {
    return this.useCase.execute(userId, id, dto);
  }
}
