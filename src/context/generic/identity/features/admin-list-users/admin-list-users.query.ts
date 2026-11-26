import { Transform } from "class-transformer";
import { ArrayUnique, IsArray, IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { PaginationQuery } from "@core/http/pagination.js";
import { PERMISSION_NAMES, type PermissionName } from "../../domain/permissions.js";
import { USER_STATUSES, type UserStatus } from "../../domain/user.repository.js";

/** Query params de GET /admin/users. */
export class AdminListUsersQuery extends PaginationQuery {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  /** Comptes qui ont toutes ces permissions : ?permission=USERS_SUSPEND&permission=ORDERS_READ_ALL */
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @ArrayUnique()
  @IsIn(PERMISSION_NAMES, { each: true })
  permission?: PermissionName[];

  @IsOptional()
  @IsIn([...USER_STATUSES])
  status?: UserStatus;
}
