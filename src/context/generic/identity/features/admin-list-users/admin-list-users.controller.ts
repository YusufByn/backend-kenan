import { Controller, Get, Query } from "@nestjs/common";
import { withMeta } from "@core/http/api-response.js";
import { RequirePermission } from "../../public/require-permission.decorator.js";
import { AdminListUsersQuery } from "./admin-list-users.query.js";
import { AdminListUsersUseCase } from "./admin-list-users.use-case.js";

@Controller("admin/users")
@RequirePermission("USERS_READ")
export class AdminListUsersController {
  constructor(private readonly useCase: AdminListUsersUseCase) {}

  @Get()
  async handle(@Query() query: AdminListUsersQuery) {
    const { items, ...pagination } = await this.useCase.execute(query);
    return withMeta(items, pagination);
  }
}
