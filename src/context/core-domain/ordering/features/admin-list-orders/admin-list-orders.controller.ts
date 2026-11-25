import { Controller, Get, Query } from "@nestjs/common";
import { RequireRole } from "@identity";
import { withMeta } from "@core/http/api-response.js";
import { AdminListOrdersQuery } from "./admin-list-orders.query.js";
import { AdminListOrdersUseCase } from "./admin-list-orders.use-case.js";

@Controller("admin/orders")
@RequireRole("moderator")
export class AdminListOrdersController {
  constructor(private readonly useCase: AdminListOrdersUseCase) {}

  @Get()
  async handle(@Query() query: AdminListOrdersQuery) {
    const { items, ...pagination } = await this.useCase.execute(query);
    return withMeta(items, pagination);
  }
}
