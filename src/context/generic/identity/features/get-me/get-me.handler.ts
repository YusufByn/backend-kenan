import { Injectable } from "@nestjs/common";
import type { UserProfile } from "../../domain/user.entity.js";
import { UserRepository } from "../../domain/user.repository.js";

@Injectable()
export class GetMeHandler {
  constructor(private readonly users: UserRepository) {}

  async execute(userId: string): Promise<UserProfile> {
    const user = await this.users.getById(userId);
    return user.toProfile();
  }
}
