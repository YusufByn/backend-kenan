import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { LoginDto } from "./login.dto.js";
import { LoginHandler } from "./login.handler.js";

@Controller("auth")
export class LoginController {
  constructor(private readonly handler: LoginHandler) {}

  @Post("login")
  @HttpCode(HttpStatus.OK) // Aucune ressource créée : 200 et pas 201.
  handle(@Body() dto: LoginDto) {
    return this.handler.execute(dto);
  }
}
