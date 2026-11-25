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

/** Compte suspendu par la modération : ni connexion, ni utilisation d'un token déjà délivré. */
export class AccountSuspendedError extends DomainError {
  readonly kind = "forbidden";
  readonly errcode = "ACCOUNT_SUSPENDED";

  constructor() {
    super("Ce compte est suspendu");
  }
}

/** Connecté, mais il manque au moins une permission pour cette route. */
export class InsufficientPermissionsError extends DomainError {
  readonly kind = "forbidden";
  readonly errcode = "INSUFFICIENT_PERMISSIONS";

  constructor(missing: string[]) {
    super(`Permission manquante : ${missing.join(", ")}`);
  }
}

/** Action refusée sur ce user précis (soi-même, droits égaux ou supérieurs, bit qu'on ne possède pas). */
export class UserActionForbiddenError extends DomainError {
  readonly kind = "forbidden";
  readonly errcode = "USER_ACTION_FORBIDDEN";
}

export class UserAlreadySuspendedError extends DomainError {
  readonly kind = "conflict";
  readonly errcode = "USER_ALREADY_SUSPENDED";

  constructor() {
    super("Ce compte est déjà suspendu");
  }
}

export class UserNotSuspendedError extends DomainError {
  readonly kind = "conflict";
  readonly errcode = "USER_NOT_SUSPENDED";

  constructor() {
    super("Ce compte n'est pas suspendu");
  }
}
