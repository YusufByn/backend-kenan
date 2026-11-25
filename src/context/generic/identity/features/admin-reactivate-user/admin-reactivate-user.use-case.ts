import { Injectable } from "@nestjs/common";
import type { UserAdminView } from "../../domain/user.js";
import { UserRepository } from "../../domain/user.repository.js";

@Injectable()
export class AdminReactivateUserUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(actorId: string, userId: string): Promise<UserAdminView> {
    const actor = await this.users.getById(actorId);
    const user = await this.users.getById(userId);

    user.reactivate(actor);
    await this.users.save(user);
    return user.toAdminView();
  }
}
