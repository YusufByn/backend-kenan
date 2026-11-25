import { Body, Controller, Patch, UseGuards } from "@nestjs/common";
import { CurrentUserId } from "../../public/current-user-id.decorator.js";
import { JwtAuthGuard } from "../../public/jwt-auth.guard.js";
import { UpdateMeDto } from "./update-me.dto.js";
import { UpdateMeUseCase } from "./update-me.use-case.js";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class UpdateMeController {
  constructor(private readonly useCase: UpdateMeUseCase) {}

  @Patch()
  handle(@CurrentUserId() userId: string, @Body() dto: UpdateMeDto) {
    return this.useCase.execute(userId, dto);
  }
}
