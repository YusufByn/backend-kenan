import { Injectable } from "@nestjs/common";
import { toMask, type PermissionName } from "../../domain/permissions.js";
import type { UserAdminView } from "../../domain/user.js";
import { UserRepository, type UserSearch } from "../../domain/user.repository.js";

export type UserPage = { items: UserAdminView[]; page: number; limit: number; total: number };

@Injectable()
export class AdminListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(criteria: Omit<UserSearch, "permissions"> & { permission?: PermissionName[] }): Promise<UserPage> {
    const { permission, ...search } = criteria;
    const { items, total } = await this.users.search({ ...search, permissions: permission && toMask(permission) });
    return { items: items.map((user) => user.toAdminView()), page: criteria.page, limit: criteria.limit, total };
  }
}
