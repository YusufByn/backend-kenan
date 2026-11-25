import { Controller, Get, UseGuards } from "@nestjs/common";
import { CurrentUserId } from "../../public/current-user-id.decorator.js";
import { JwtAuthGuard } from "../../public/jwt-auth.guard.js";
import { GetMeHandler } from "./get-me.handler.js";

@Controller("me")
@UseGuards(JwtAuthGuard)
export class GetMeController {
  constructor(private readonly handler: GetMeHandler) {}

  @Get()
  handle(@CurrentUserId() userId: string) {
    return this.handler.execute(userId);
  }
}
