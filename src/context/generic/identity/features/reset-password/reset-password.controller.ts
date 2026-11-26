import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { StrictRateLimit } from "@core/http/rate-limit.js";
import { ResetPasswordDto } from "./reset-password.dto.js";
import { ResetPasswordUseCase } from "./reset-password.use-case.js";

@Controller("auth")
export class ResetPasswordController {
  constructor(private readonly useCase: ResetPasswordUseCase) {}

  @Post("reset-password")
  @StrictRateLimit() // force brute / spam d'emails : 5 essais par minute et par IP
  @HttpCode(HttpStatus.OK)
  handle(@Body() dto: ResetPasswordDto) {
    return this.useCase.execute(dto);
  }
}
