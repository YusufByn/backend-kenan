import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { CurrentUserId } from "../../public/current-user-id.decorator.js";
import { RequirePermission } from "../../public/require-permission.decorator.js";
import { AdminSuspendUserUseCase } from "./admin-suspend-user.use-case.js";

@Controller("admin/users")
@RequirePermission("USERS_SUSPEND")
export class AdminSuspendUserController {
  constructor(private readonly useCase: AdminSuspendUserUseCase) {}

  @Post(":id/suspend")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() actorId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(actorId, id);
  }
}
