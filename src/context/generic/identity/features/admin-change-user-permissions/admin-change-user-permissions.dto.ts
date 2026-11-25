import { ArrayUnique, IsArray, IsIn, IsOptional } from "class-validator";
import { PERMISSION_NAMES, type PermissionName } from "../../domain/permissions.js";

/** { grant: ["ORDERS_READ_ALL"], revoke: ["LISTING_SELL"] }. Les noms, jamais les bits : le client n'a pas à connaître le catalogue. */
export class AdminChangeUserPermissionsDto {
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(PERMISSION_NAMES, { each: true })
  grant: PermissionName[] = [];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsIn(PERMISSION_NAMES, { each: true })
  revoke: PermissionName[] = [];
}
