import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { ConfirmDeliveryHandler } from "./confirm-delivery.handler.js";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class ConfirmDeliveryController {
  constructor(private readonly handler: ConfirmDeliveryHandler) {}

  @Post(":id/confirm-delivery")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.handler.execute(userId, id);
  }
}
