import { Body, Controller, Param, ParseUUIDPipe, Patch } from "@nestjs/common";
import { CurrentUserId } from "../../public/current-user-id.decorator.js";
import { RequirePermission } from "../../public/require-permission.decorator.js";
import { AdminChangeUserPermissionsDto } from "./admin-change-user-permissions.dto.js";
import { AdminChangeUserPermissionsUseCase } from "./admin-change-user-permissions.use-case.js";

@Controller("admin/users")
@RequirePermission("USERS_MANAGE_PERMISSIONS")
export class AdminChangeUserPermissionsController {
  constructor(private readonly useCase: AdminChangeUserPermissionsUseCase) {}

  @Patch(":id/permissions")
  handle(
    @CurrentUserId() actorId: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AdminChangeUserPermissionsDto,
  ) {
    return this.useCase.execute(actorId, id, dto);
  }
}
