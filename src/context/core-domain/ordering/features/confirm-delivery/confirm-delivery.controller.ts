import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { ConfirmDeliveryUseCase } from "./confirm-delivery.use-case.js";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class ConfirmDeliveryController {
  constructor(private readonly useCase: ConfirmDeliveryUseCase) {}

  @Post(":id/confirm-delivery")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(userId, id);
  }
}
