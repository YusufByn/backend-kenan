import { Injectable, type CanActivate, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import { AccessTokens } from "../domain/access-tokens.js";
import { InvalidTokenError, MissingTokenError } from "../domain/user.errors.js";

/** Requête après passage du guard : l'id du user connecté y est attaché. */
export type AuthenticatedRequest = Request & { userId?: string };

/**
 * Protège une route : exige un en-tête "Authorization: Bearer <token>" valide.
 * Utilisable par les autres contextes (exporté par public-api.ts) :
 *   @UseGuards(JwtAuthGuard) + @CurrentUserId() userId: string
 * Leur module doit importer IdentityModule.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: AccessTokens) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const [scheme, token] = request.headers.authorization?.split(" ") ?? [];
    if (scheme !== "Bearer" || !token) throw new MissingTokenError();

    const userId = await this.tokens.verify(token);
    if (!userId) throw new InvalidTokenError();

    request.userId = userId;
    return true;
  }
}
