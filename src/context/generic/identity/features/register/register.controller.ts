import { Body, Controller, Post } from "@nestjs/common";
import { RegisterDto } from "./register.dto.js";
import { RegisterHandler } from "./register.handler.js";

@Controller("auth")
export class RegisterController {
  constructor(private readonly handler: RegisterHandler) {}

  @Post("register")
  handle(@Body() dto: RegisterDto) {
    return this.handler.execute(dto);
  }
}
