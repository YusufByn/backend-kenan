import { Injectable } from "@nestjs/common";
import type { UserProfile } from "../../domain/user.js";
import { UserRepository } from "../../domain/user.repository.js";

@Injectable()
export class UpdateMeUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string, changes: { name?: string; email?: string }): Promise<UserProfile> {
    const user = await this.users.getById(userId);
    if (changes.email !== undefined) await this.users.assertEmailAvailable(changes.email, user.id);

    user.update(changes);
    await this.users.save(user);
    return user.toProfile();
  }
}
