import { DomainError } from "@core/errors/domain-error.js";

export class InvalidReviewError extends DomainError {
  readonly kind = "invalid";
  readonly errcode = "REVIEW_INVALID";
}

/** Commande inconnue, ou dont on n'est pas l'acheteur. */
export class ReviewableOrderNotFoundError extends DomainError {
  readonly kind = "not_found";
  readonly errcode = "ORDER_NOT_FOUND";

  constructor(orderId: string) {
    super(`Aucune commande avec l'id ${orderId}`, "orderId");
  }
}

export class ReviewNotAllowedError extends DomainError {
  readonly kind = "conflict";
  readonly errcode = "REVIEW_ORDER_NOT_DELIVERED";

  constructor() {
    super("Tu ne peux noter le vendeur qu'une fois la commande livrée");
  }
}

export class ReviewAlreadyExistsError extends DomainError {
  readonly kind = "conflict";
  readonly errcode = "REVIEW_ALREADY_EXISTS";

  constructor() {
    super("Tu as déjà laissé un avis pour cette commande");
  }
}

export class ReviewNotFoundError extends DomainError {
  readonly kind = "not_found";
  readonly errcode = "REVIEW_NOT_FOUND";

  constructor(id: string) {
    super(`Aucun avis avec l'id ${id}`);
  }
}

export class ReviewActionForbiddenError extends DomainError {
  readonly kind = "forbidden";
  readonly errcode = "REVIEW_ACTION_FORBIDDEN";
}

export class ReviewAlreadyRepliedError extends DomainError {
  readonly kind = "conflict";
  readonly errcode = "REVIEW_ALREADY_REPLIED";

  constructor() {
    super("Tu as déjà répondu à cet avis");
  }
}
