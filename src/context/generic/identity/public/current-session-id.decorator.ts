import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedRequest } from "./jwt-auth.guard.js";

/**
 * Injecte l'id de la session de la requête (logout, liste des sessions, changement de mot de passe).
 * Ne marche que sur une route protégée par JwtAuthGuard. Interne à identity : pas exporté par public-api.ts.
 */
export const CurrentSessionId = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const { sessionId } = context.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!sessionId) throw new Error("@CurrentSessionId() utilisé sur une route sans @UseGuards(JwtAuthGuard)");
  return sessionId;
});
