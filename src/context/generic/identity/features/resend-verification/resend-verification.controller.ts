import { Controller, HttpCode, HttpStatus, Post, UseGuards } from "@nestjs/common";
import { StrictRateLimit } from "@core/http/rate-limit.js";
import { CurrentUserId } from "../../public/current-user-id.decorator.js";
import { JwtAuthGuard } from "../../public/jwt-auth.guard.js";
import { ResendVerificationUseCase } from "./resend-verification.use-case.js";

@Controller("auth")
@UseGuards(JwtAuthGuard)
export class ResendVerificationController {
  constructor(private readonly useCase: ResendVerificationUseCase) {}

  @Post("resend-verification")
  @HttpCode(HttpStatus.OK)
  @StrictRateLimit()
  handle(@CurrentUserId() userId: string) {
    return this.useCase.execute(userId);
  }
}
