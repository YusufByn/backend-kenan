import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { StrictRateLimit } from "@core/http/rate-limit.js";
import { VerifyEmailDto } from "./verify-email.dto.js";
import { VerifyEmailUseCase } from "./verify-email.use-case.js";

@Controller("auth")
export class VerifyEmailController {
  constructor(private readonly useCase: VerifyEmailUseCase) {}

  @Post("verify-email")
  @HttpCode(HttpStatus.OK)
  @StrictRateLimit()
  handle(@Body() dto: VerifyEmailDto) {
    return this.useCase.execute(dto);
  }
}
