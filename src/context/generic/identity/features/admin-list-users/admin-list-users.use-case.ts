import { Injectable } from "@nestjs/common";
import type { UserAdminView } from "../../domain/user.js";
import { UserRepository, type UserSearch } from "../../domain/user.repository.js";

export type UserPage = { items: UserAdminView[]; page: number; limit: number; total: number };

@Injectable()
export class AdminListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(criteria: UserSearch): Promise<UserPage> {
    const { items, total } = await this.users.search(criteria);
    return { items: items.map((user) => user.toAdminView()), page: criteria.page, limit: criteria.limit, total };
  }
}
