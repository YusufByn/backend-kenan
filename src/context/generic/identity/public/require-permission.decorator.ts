import {
  applyDecorators,
  Injectable,
  SetMetadata,
  UseGuards,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { hasAll, remove } from "@core/bitmask/bitmask.js";
import { toMask, toNames, type PermissionName } from "../domain/permissions.js";
import { InsufficientPermissionsError } from "../domain/user.errors.js";
import { JwtAuthGuard, type AuthenticatedRequest } from "./jwt-auth.guard.js";

const REQUIRED_PERMISSIONS = "identity:required-permissions";

/** Vérifie le masque posé par @RequirePermission. Passe toujours après JwtAuthGuard, qui a attaché le masque du user. */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<bigint | undefined>(REQUIRED_PERMISSIONS, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (required === undefined) return true;

    const { userPermissions } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (userPermissions === undefined) {
      throw new Error("PermissionGuard exécuté sans JwtAuthGuard : utilise @RequirePermission(), pas @UseGuards(PermissionGuard)");
    }
    // Un AND et une comparaison : c'est tout le coût du check.
    if (!hasAll(userPermissions, required)) {
      throw new InsufficientPermissionsError(toNames(remove(required, userPermissions)));
    }
    return true;
  }
}

/**
 * Réserve une route (ou tout un controller) aux users qui ont TOUTES les permissions données.
 * Les noms sont convertis en masque une seule fois, au chargement du controller.
 * Inclut JwtAuthGuard : ne pas ajouter @UseGuards(JwtAuthGuard) en plus (le user serait relu deux fois).
 *   @RequirePermission("ORDER_PLACE")
 *   @RequirePermission("USERS_READ", "USERS_SUSPEND")
 * 401 sans token valide, 403 ACCOUNT_SUSPENDED ou INSUFFICIENT_PERMISSIONS sinon.
 */
export const RequirePermission = (...permissions: [PermissionName, ...PermissionName[]]) =>
  applyDecorators(SetMetadata(REQUIRED_PERMISSIONS, toMask(permissions)), UseGuards(JwtAuthGuard, PermissionGuard));
