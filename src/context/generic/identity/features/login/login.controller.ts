import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { LoginDto } from "./login.dto.js";
import { LoginUseCase } from "./login.use-case.js";

@Controller("auth")
export class LoginController {
  constructor(private readonly useCase: LoginUseCase) {}

  @Post("login")
  @HttpCode(HttpStatus.OK) // Aucune ressource créée : 200 et pas 201.
  handle(@Body() dto: LoginDto) {
    return this.useCase.execute(dto);
  }
}
