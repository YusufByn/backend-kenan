import { Injectable } from "@nestjs/common";
import { toMask, type PermissionName } from "../../domain/permissions.js";
import type { UserAdminView } from "../../domain/user.js";
import { InvalidUserError } from "../../domain/user.errors.js";
import { UserRepository } from "../../domain/user.repository.js";

@Injectable()
export class AdminChangeUserPermissionsUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(
    actorId: string,
    userId: string,
    change: { grant: PermissionName[]; revoke: PermissionName[] },
  ): Promise<UserAdminView> {
    const grant = toMask(change.grant);
    const revoke = toMask(change.revoke);
    if ((grant & revoke) !== 0n) {
      throw new InvalidUserError("Une permission ne peut pas être à la fois donnée et retirée", "grant");
    }

    const actor = await this.users.getById(actorId);
    const user = await this.users.getById(userId);

    user.changePermissions(actor, { grant, revoke });
    await this.users.save(user);
    return user.toAdminView();
  }
}
