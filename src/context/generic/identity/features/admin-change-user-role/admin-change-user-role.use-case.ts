import { Injectable } from "@nestjs/common";
import { ROLE_PRESETS, type Role } from "../../domain/role.js";
import type { UserAdminView } from "../../domain/user.js";
import { UserRepository } from "../../domain/user.repository.js";

/** Remplace tout le masque par celui d'un rôle (raccourci). Pour ajuster permission par permission : admin-change-user-permissions. */
@Injectable()
export class AdminChangeUserRoleUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(actorId: string, userId: string, role: Role): Promise<UserAdminView> {
    const actor = await this.users.getById(actorId);
    const user = await this.users.getById(userId);

    user.changePermissions(actor, { set: ROLE_PRESETS[role] });
    await this.users.save(user);
    return user.toAdminView();
  }
}
