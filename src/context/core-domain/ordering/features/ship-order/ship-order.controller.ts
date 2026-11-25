import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, UseGuards } from "@nestjs/common";
import { CurrentUserId, JwtAuthGuard } from "@identity";
import { ShipOrderDto } from "./ship-order.dto.js";
import { ShipOrderHandler } from "./ship-order.handler.js";

@Controller("orders")
@UseGuards(JwtAuthGuard)
export class ShipOrderController {
  constructor(private readonly handler: ShipOrderHandler) {}

  @Post(":id/ship")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() userId: string, @Param("id", ParseUUIDPipe) id: string, @Body() dto: ShipOrderDto) {
    return this.handler.execute(userId, id, dto.trackingNumber);
  }
}
