import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import { RequireRole } from "@identity";
import { AdminGetOrderUseCase } from "./admin-get-order.use-case.js";

@Controller("admin/orders")
@RequireRole("moderator")
export class AdminGetOrderController {
  constructor(private readonly useCase: AdminGetOrderUseCase) {}

  @Get(":id")
  handle(@Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(id);
  }
}
