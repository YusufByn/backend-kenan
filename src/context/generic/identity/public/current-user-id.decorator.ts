import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { AuthenticatedRequest } from "./jwt-auth.guard.js";

/** Injecte l'id du user connecté. Ne marche que sur une route protégée par JwtAuthGuard. */
export const CurrentUserId = createParamDecorator((_data: unknown, context: ExecutionContext): string => {
  const { userId } = context.switchToHttp().getRequest<AuthenticatedRequest>();
  if (!userId) throw new Error("@CurrentUserId() utilisé sur une route sans @UseGuards(JwtAuthGuard)");
  return userId;
});
