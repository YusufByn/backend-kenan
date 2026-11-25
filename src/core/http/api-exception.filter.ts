import { Catch, HttpException, HttpStatus, Logger, type ArgumentsHost, type ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { DomainError, type DomainErrorKind } from "../errors/domain-error.js";
import type { ApiError } from "./api-response.js";

const STATUS_BY_KIND: Record<DomainErrorKind, HttpStatus> = {
  invalid: HttpStatus.BAD_REQUEST,
  unauthorized: HttpStatus.UNAUTHORIZED,
  forbidden: HttpStatus.FORBIDDEN,
  not_found: HttpStatus.NOT_FOUND,
  conflict: HttpStatus.CONFLICT,
};

/**
 * Seul endroit qui écrit une réponse d'erreur, au format ApiError. Trois cas :
 * 1. DomainError (services, domaine, validation des DTO) : message, fields et errcode tels quels.
 * 2. HttpException de Nest (route inconnue, JSON mal formé, UUID invalide...) : errcode déduit du status.
 * 3. Tout le reste (erreur SQLite/TypeORM, bug...) : 500 avec un message générique.
 *    Le détail part dans les logs du serveur, jamais dans la réponse : il peut contenir
 *    des requêtes SQL, des noms de tables ou des valeurs en base.
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const body = this.toApiError(exception);
    host.switchToHttp().getResponse<Response>().status(body.code).json(body);
  }

  private toApiError(exception: unknown): ApiError {
    if (exception instanceof DomainError) {
      return {
        code: STATUS_BY_KIND[exception.kind],
        message: exception.message,
        fields: exception.fields,
        errcode: exception.errcode,
      };
    }
    if (exception instanceof HttpException) {
      const code = exception.getStatus();
      return { code, message: exception.message, fields: null, errcode: HttpStatus[code] ?? "HTTP_ERROR" };
    }

    this.logger.error(exception instanceof Error ? (exception.stack ?? exception.message) : String(exception));
    return {
      code: HttpStatus.INTERNAL_SERVER_ERROR,
      message: "Une erreur interne est survenue",
      fields: null,
      errcode: "INTERNAL_ERROR",
    };
  }
}
