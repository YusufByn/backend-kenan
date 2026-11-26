import { Controller, Get, Query } from "@nestjs/common";
import { withPage } from "@core/http/api-response.js";
import { RequirePermission } from "../../public/require-permission.decorator.js";
import { AdminListUsersQuery } from "./admin-list-users.query.js";
import { AdminListUsersUseCase } from "./admin-list-users.use-case.js";

@Controller("admin/users")
@RequirePermission("USERS_READ")
export class AdminListUsersController {
  constructor(private readonly useCase: AdminListUsersUseCase) {}

  @Get()
  async handle(@Query() query: AdminListUsersQuery) {
    return withPage(await this.useCase.execute(query));
  }
}
