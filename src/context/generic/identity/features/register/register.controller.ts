import { Body, Controller, Headers, Ip, Post } from "@nestjs/common";
import { StrictRateLimit } from "@core/http/rate-limit.js";
import { RegisterDto } from "./register.dto.js";
import { RegisterUseCase } from "./register.use-case.js";

@Controller("auth")
export class RegisterController {
  constructor(private readonly useCase: RegisterUseCase) {}

  @Post("register")
  @StrictRateLimit() // force brute / spam d'emails : 5 essais par minute et par IP
  handle(@Body() dto: RegisterDto, @Headers("user-agent") userAgent: string | undefined, @Ip() ip: string) {
    return this.useCase.execute(dto, { userAgent: userAgent ?? null, ip });
  }
}
