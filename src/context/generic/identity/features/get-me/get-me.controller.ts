import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUserId } from "../../public/current-user-id.decorator.js";
import { JwtAuthGuard } from "../../public/jwt-auth.guard.js";
import { GetMeUseCase } from "./get-me.use-case.js";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class GetMeController {
  constructor(private readonly useCase: GetMeUseCase) {}

  @Get()
  handle(@CurrentUserId() userId: string) {
    return this.useCase.execute(userId);
  }
}
