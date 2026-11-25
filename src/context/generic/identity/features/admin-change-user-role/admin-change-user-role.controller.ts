import { Body, Controller, Param, ParseUUIDPipe, Patch } from "@nestjs/common";
import { CurrentUserId } from "../../public/current-user-id.decorator.js";
import { RequireRole } from "../../public/require-role.decorator.js";
import { AdminChangeUserRoleDto } from "./admin-change-user-role.dto.js";
import { AdminChangeUserRoleUseCase } from "./admin-change-user-role.use-case.js";

@Controller("admin/users")
@RequireRole("admin")
export class AdminChangeUserRoleController {
  constructor(private readonly useCase: AdminChangeUserRoleUseCase) {}

  @Patch(":id/role")
  handle(
    @CurrentUserId() actorId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AdminChangeUserRoleDto,
  ) {
    return this.useCase.execute(actorId, id, dto.role);
  }
}
