import { Injectable } from "@nestjs/common";
import type { Page } from "@core/http/pagination.js";
import { toMask, type PermissionName } from "../../domain/permissions.js";
import type { UserAdminView } from "../../domain/user.js";
import { UserRepository, type UserSearch } from "../../domain/user.repository.js";

@Injectable()
export class AdminListUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  async execute(criteria: Omit<UserSearch, "permissions"> & { permission?: PermissionName[] }): Promise<Page<UserAdminView>> {
    const { permission, ...search } = criteria;
    const { items, total } = await this.users.search({ ...search, permissions: permission && toMask(permission) });
    return { items: items.map((user) => user.toAdminView()), page: criteria.page, limit: criteria.limit, total };
  }
}
