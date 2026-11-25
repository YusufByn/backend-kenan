import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { ROLES, type Role } from "../../domain/role.js";
import { USER_STATUSES, type UserStatus } from "../../domain/user.repository.js";

/** Query params de GET /admin/users. */
export class AdminListUsersQuery {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn([...ROLES])
  role?: Role;

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
