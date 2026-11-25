import { IsIn } from "class-validator";
import { ROLES, type Role } from "../../domain/role.js";

export class AdminChangeUserRoleDto {
  @IsIn([...ROLES])
  role!: Role;
}
