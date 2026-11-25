import { DomainError } from "@core/errors/domain-error.js";

export class InvalidUserError extends DomainError {
  readonly kind = "invalid";
  readonly errcode = "USER_INVALID";
}

export class UserNotFoundError extends DomainError {
  readonly kind = "not_found";
  readonly errcode = "USER_NOT_FOUND";

  constructor(id: string) {
    super(`Aucun user avec l'id ${id}`);
  }
}

export class EmailAlreadyUsedError extends DomainError {
  readonly kind = "conflict";
  readonly errcode = "EMAIL_ALREADY_USED";

  constructor() {
    super("Cet email est déjà utilisé", "email");
  }
}

/** Même message que l'email soit inconnu ou le mot de passe faux : on ne révèle pas quels emails existent. */
export class InvalidCredentialsError extends DomainError {
  readonly kind = "unauthorized";
  readonly errcode = "INVALID_CREDENTIALS";

  constructor() {
    super("Email ou mot de passe incorrect");
  }
}

export class MissingTokenError extends DomainError {
  readonly kind = "unauthorized";
  readonly errcode = "TOKEN_MISSING";

  constructor() {
    super("Token manquant : envoie l'en-tête Authorization: Bearer <token>");
  }
}

export class InvalidTokenError extends DomainError {
  readonly kind = "unauthorized";
  readonly errcode = "TOKEN_INVALID";

  constructor() {
    super("Token invalide ou expiré");
  }
}
