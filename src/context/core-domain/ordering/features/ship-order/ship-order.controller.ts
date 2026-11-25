import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { ShipOrderDto } from "./ship-order.dto.js";
import { ShipOrderUseCase } from "./ship-order.use-case.js";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class ShipOrderController {
  constructor(private readonly useCase: ShipOrderUseCase) {}

  @Post(":id/ship")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string, @Body() dto: ShipOrderDto) {
    return this.useCase.execute(userId, id, dto.trackingNumber);
  }
}
