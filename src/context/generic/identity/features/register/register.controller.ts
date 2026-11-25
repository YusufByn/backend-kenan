import { Body, Controller, Post } from "@nestjs/common";
import { RegisterDto } from "./register.dto.js";
import { RegisterUseCase } from "./register.use-case.js";

@Controller("auth")
export class RegisterController {
  constructor(private readonly useCase: RegisterUseCase) {}

  @Post("register")
  handle(@Body() dto: RegisterDto) {
    return this.useCase.execute(dto);
  }
}
