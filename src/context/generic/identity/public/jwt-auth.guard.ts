import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { AccessTokens } from "../domain/access-tokens.js";
import { InvalidTokenError, MissingTokenError } from "../domain/user.errors.js";
import { UserRepository } from "../domain/user.repository.js";

/** Requête après passage du guard : l'id et le masque de permissions du user connecté y sont attachés. */
export type AuthenticatedRequest = Request & { userId?: string; userPermissions?: bigint };

/**
 * Protège une route : exige un en-tête "Authorization: Bearer <token>" valide.
 * Utilisable par les autres contextes (exporté par public-api.ts) :
 *   @UseGuards(JwtAuthGuard) + @CurrentUserId() userId: string
 * Leur module doit importer IdentityModule.
 *
 * Le user est relu en base à chaque requête : un compte supprimé (401) ou suspendu (403)
 * est bloqué tout de suite, et les permissions sont celles d'aujourd'hui, pas celles de la connexion.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: AccessTokens,
    private readonly users: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) throw new MissingTokenError();

    const userId = await this.tokens.verify(token);
    if (!userId) throw new InvalidTokenError();

    const user = await this.users.findById(userId);
    if (!user) throw new InvalidTokenError();
    user.assertActive();

    request.userId = user.id;
    request.userPermissions = user.permissions;
    return true;
  }
}
