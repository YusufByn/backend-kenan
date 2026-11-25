import { Transform, Type } from "class-transformer";
import { ArrayUnique, IsArray, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { PERMISSION_NAMES, type PermissionName } from "../../domain/permissions.js";
import { USER_STATUSES, type UserStatus } from "../../domain/user.repository.js";

/** Query params de GET /admin/users. */
export class AdminListUsersQuery {
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

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit: number = 20;
}
