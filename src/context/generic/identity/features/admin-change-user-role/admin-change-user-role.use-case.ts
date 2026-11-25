import { Injectable } from "@nestjs/common";
import type { Role } from "../../domain/role.js";
import type { UserAdminView } from "../../domain/user.js";
import { UserRepository } from "../../domain/user.repository.js";

@Injectable()
export class AdminChangeUserRoleUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(actorId: string, userId: string, role: Role): Promise<UserAdminView> {
    const actor = await this.users.getById(actorId);
    const user = await this.users.getById(userId);

    user.changeRole(actor, role);
    await this.users.save(user);
    return user.toAdminView();
  }
}
