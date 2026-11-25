import { Injectable } from "@nestjs/common";
import type { UserAdminView } from "../../domain/user.js";
import { UserRepository } from "../../domain/user.repository.js";

/** Effet immédiat : JwtAuthGuard relit le user à chaque requête, ses tokens déjà délivrés ne passent plus. */
@Injectable()
export class AdminSuspendUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(actorId: string, userId: string): Promise<UserAdminView> {
    const actor = await this.users.getById(actorId);
    const user = await this.users.getById(userId);

    user.suspend(actor, new Date());
    await this.users.save(user);
    return user.toAdminView();
  }
}
