import { Body, Controller, Patch, UseGuards } from "@nestjs/common";
import { CurrentUserId } from "../../public/current-user-id.decorator.js";
import { JwtAuthGuard } from "../../public/jwt-auth.guard.js";
import { UpdateMeDto } from "./update-me.dto.js";
import { UpdateMeHandler } from "./update-me.handler.js";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class UpdateMeController {
  constructor(private readonly handler: UpdateMeHandler) {}

  @Patch()
  handle(@CurrentUserId() userId: string, @Body() dto: UpdateMeDto) {
    return this.handler.execute(userId, dto);
  }
}
