import { Body, Controller, Headers, HttpCode, HttpStatus, Ip, Post } from "@nestjs/common";
import { StrictRateLimit } from "@core/http/rate-limit.js";
import { LoginDto } from "./login.dto.js";
import { LoginUseCase } from "./login.use-case.js";

@Controller("auth")
export class LoginController {
  constructor(private readonly useCase: LoginUseCase) {}

  @Post("login")
  @StrictRateLimit() // force brute / spam d'emails : 5 essais par minute et par IP
  @HttpCode(HttpStatus.OK) // Aucune ressource créée : 200 et pas 201.
  handle(@Body() dto: LoginDto, @Headers("user-agent") userAgent: string | undefined, @Ip() ip: string) {
    return this.useCase.execute(dto, { userAgent: userAgent ?? null, ip });
  }
}
