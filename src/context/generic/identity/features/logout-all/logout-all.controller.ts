import { Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId } from "../../public/current-user-id.decorator.js";
import { JwtAuthGuard } from "../../public/jwt-auth.guard.js";
import { LogoutAllUseCase } from "./logout-all.use-case.js";

@Controller("auth")
@UseGuards(JwtAuthGuard)
export class LogoutAllController {
  constructor(private readonly useCase: LogoutAllUseCase) {}

  @Post("logout-all")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string) {
    return this.useCase.execute(userId);
  }
}
