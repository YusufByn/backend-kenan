import { Body, Controller, HttpCode, HttpStatus, Patch, UseGuards } from "@nestjs/common";
import { CurrentSessionId } from "../../public/current-session-id.decorator.js";
import { CurrentUserId } from "../../public/current-user-id.decorator.js";
import { JwtAuthGuard } from "../../public/jwt-auth.guard.js";
import { ChangePasswordDto } from "./change-password.dto.js";
import { ChangePasswordUseCase } from "./change-password.use-case.js";

@Controller("me/password")
@UseGuards(JwtAuthGuard)
export class ChangePasswordController {
  constructor(private readonly useCase: ChangePasswordUseCase) {}

  @Patch()
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @CurrentSessionId() sessionId: string, @Body() dto: ChangePasswordDto) {
    return this.useCase.execute(userId, sessionId, dto);
  }
}
