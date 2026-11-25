import {
  applyDecorators,
  Injectable,
  SetMetadata,
  UseGuards,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { hasAtLeastRole, type Role } from "../domain/role.js";
import { InsufficientRoleError } from "../domain/user.errors.js";
import { JwtAuthGuard, type AuthenticatedRequest } from "./jwt-auth.guard.js";

const REQUIRED_ROLE = "identity:required-role";

/** Vérifie le rôle posé par @RequireRole. Passe toujours après JwtAuthGuard, qui a attaché le rôle à la requête. */
@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role | undefined>(REQUIRED_ROLE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const { userRole } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!userRole) throw new Error("RoleGuard exécuté sans JwtAuthGuard : utilise @RequireRole(), pas @UseGuards(RoleGuard)");
    if (!hasAtLeastRole(userRole, required)) throw new InsufficientRoleError(required);
    return true;
  }
}

/**
 * Réserve une route (ou tout un controller) à un rôle minimum. Inclut JwtAuthGuard :
 * ne pas ajouter @UseGuards(JwtAuthGuard) en plus (le user serait relu deux fois).
 *   @RequireRole("moderator")  → moderator et admin
 *   @RequireRole("admin")      → admin seulement
 * 401 sans token valide, 403 ACCOUNT_SUSPENDED ou INSUFFICIENT_ROLE sinon.
 */
export const RequireRole = (role: Role) =>
  applyDecorators(SetMetadata(REQUIRED_ROLE, role), UseGuards(JwtAuthGuard, RoleGuard));
