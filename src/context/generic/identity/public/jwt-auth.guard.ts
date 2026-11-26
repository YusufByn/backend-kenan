import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { AccessTokens } from "../domain/access-tokens.js";
import { SessionRepository } from "../domain/session.repository.js";
import { InvalidTokenError, MissingTokenError } from "../domain/user.errors.js";
import { UserRepository } from "../domain/user.repository.js";

/** Requête après passage du guard : l'id, la session et le masque de permissions du user connecté y sont attachés. */
export type AuthenticatedRequest = Request & { userId?: string; sessionId?: string; userPermissions?: bigint };

/**
 * Protège une route : exige un en-tête "Authorization: Bearer <token>" valide.
 * Utilisable par les autres contextes (exporté par public-api.ts) :
 *   @UseGuards(JwtAuthGuard) + @CurrentUserId() userId: string
 * Leur module doit importer IdentityModule.
 *
 * La session et le user sont relus en base à chaque requête :
 * - session révoquée (logout, changement de mot de passe...) ou expirée : 401 tout de suite, même avec un token pas encore expiré ;
 * - compte supprimé (401) ou suspendu (403) : bloqué tout de suite ;
 * - les permissions sont celles d'aujourd'hui, pas celles de la connexion.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly tokens: AccessTokens,
    private readonly sessions: SessionRepository,
    private readonly users: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) throw new MissingTokenError();

    const claims = await this.tokens.verify(token);
    if (!claims) throw new InvalidTokenError();

    const [session, user] = await Promise.all([this.sessions.findById(claims.sessionId), this.users.findById(claims.userId)]);
    if (!session || session.userId !== claims.userId || !session.isActive(new Date())) throw new InvalidTokenError();
    if (!user) throw new InvalidTokenError();
    user.assertActive();

    request.userId = user.id;
    request.sessionId = session.id;
    request.userPermissions = user.permissions;
    return true;
  }
}
