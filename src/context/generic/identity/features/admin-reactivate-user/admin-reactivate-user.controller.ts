import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { CurrentUserId } from "../../public/current-user-id.decorator.js";
import { RequirePermission } from "../../public/require-permission.decorator.js";
import { AdminReactivateUserUseCase } from "./admin-reactivate-user.use-case.js";

@Controller("admin/users")
@RequirePermission("USERS_SUSPEND")
export class AdminReactivateUserController {
  constructor(private readonly useCase: AdminReactivateUserUseCase) {}

  @Post(":id/reactivate")
  @HttpCode(HttpStatus.OK)
  handle(@CurrentUserId() actorId: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.useCase.execute(actorId, id);
  }
}
