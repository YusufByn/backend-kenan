import { Injectable, Logger, type NestMiddleware } from "@nestjs/common";
import type { NextFunction, Request, Response } from "express";

/**
 * Une ligne par requête, écrite quand la réponse part : méthode, route, status, durée, et le user
 * s'il est connecté (posé par JwtAuthGuard). Les 5xx en erreur, les 4xx en warning.
 *   [HTTP] POST /auth/login 401 12ms
 *   [HTTP] GET /orders 200 8ms user=3f2c...
 * Jamais le corps ni les en-têtes : ils contiennent des mots de passe et des tokens.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger("HTTP");

  use(request: Request, response: Response, next: NextFunction): void {
    const startedAt = process.hrtime.bigint();
    response.on("finish", () => {
      const ms = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
      const userId = (request as Request & { userId?: string }).userId;
      const line = `${request.method} ${request.originalUrl} ${response.statusCode} ${ms.toFixed(0)}ms${userId ? ` user=${userId}` : ""}`;
      if (response.statusCode >= 500) this.logger.error(line);
      else if (response.statusCode >= 400) this.logger.warn(line);
      else this.logger.log(line);
    });
    next();
  }
}
