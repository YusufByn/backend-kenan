import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { StrictRateLimit } from "@core/http/rate-limit.js";
import { ForgotPasswordDto } from "./forgot-password.dto.js";
import { ForgotPasswordUseCase } from "./forgot-password.use-case.js";

@Controller("auth")
export class ForgotPasswordController {
  constructor(private readonly useCase: ForgotPasswordUseCase) {}

  @Post("forgot-password")
  @StrictRateLimit() // force brute / spam d'emails : 5 essais par minute et par IP
  @HttpCode(HttpStatus.OK)
  handle(@Body() dto: ForgotPasswordDto) {
    return this.useCase.execute(dto);
  }
}
