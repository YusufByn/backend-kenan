import { Controller, Get, Query } from "@nestjs/common";
import { RequirePermission } from "@identity";
import { withPage } from "@core/http/api-response.js";
import { AdminListOrdersQuery } from "./admin-list-orders.query.js";
import { AdminListOrdersUseCase } from "./admin-list-orders.use-case.js";

@Controller("admin/orders")
@RequirePermission("ORDERS_READ_ALL")
export class AdminListOrdersController {
  constructor(private readonly useCase: AdminListOrdersUseCase) {}

  @Get()
  async handle(@Query() query: AdminListOrdersQuery) {
    return withPage(await this.useCase.execute(query));
  }
}
