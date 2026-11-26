import { DomainError } from "@core/errors/domain-error.js";

/** Refresh token inconnu, mal formé, expiré, révoqué ou déjà utilisé : même réponse, le client doit se reconnecter. */
export class InvalidRefreshTokenError extends DomainError {
  readonly kind = "unauthorized";
  readonly errcode = "REFRESH_TOKEN_INVALID";

  constructor() {
    super("Refresh token invalide ou expiré : reconnecte-toi");
  }
}

export class SessionNotFoundError extends DomainError {
  readonly kind = "not_found";
  readonly errcode = "SESSION_NOT_FOUND";

  constructor(id: string) {
    super(`Aucune session avec l'id ${id}`);
  }
}
