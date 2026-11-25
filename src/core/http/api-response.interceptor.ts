import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from "@nestjs/common";
import type { Response } from "express";
import { map, type Observable } from "rxjs";
import { WithMeta, type ApiSuccess } from "./api-response.js";

/**
 * Emballe automatiquement tout ce que renvoie un controller : { code, data, meta }.
 * - code : le status HTTP réel (200 par défaut, 201 pour un POST, ou celui de @HttpCode).
 *   Nest le fixe avant d'appeler le controller, il ne peut donc pas être faux.
 * - data : la valeur renvoyée, ou null si le controller ne renvoie rien.
 * - meta : rempli seulement si le controller renvoie withMeta(data, meta).
 * Les erreurs ne passent pas ici : elles vont directement à ApiExceptionFilter.
 */
@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccess> {
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(
      map((result: unknown) => {
        const { data, meta } = result instanceof WithMeta ? result : { data: result, meta: null };
        return { code: response.statusCode, data: data ?? null, meta: meta ?? null };
      }),
    );
  }
}
