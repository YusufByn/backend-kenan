import { DomainError } from "@core/errors/domain-error.js";

export class InvalidOrderError extends DomainError {
  readonly kind = "invalid";
  readonly errcode = "ORDER_INVALID";
}

export class EmptyCartError extends DomainError {
  readonly kind = "invalid";
  readonly errcode = "CART_EMPTY";

  constructor() {
    super("Ton panier est vide");
  }
}

export class CannotBuyOwnListingError extends DomainError {
  readonly kind = "invalid";
  readonly errcode = "CANNOT_BUY_OWN_LISTING";

  constructor() {
    super("Tu ne peux pas acheter ta propre annonce");
  }
}

export class ListingUnavailableError extends DomainError {
  readonly kind = "conflict";
  readonly errcode = "CART_LISTING_UNAVAILABLE";

  constructor() {
    super("Une annonce de ton panier n'est plus disponible");
  }
}

export class OrderNotFoundError extends DomainError {
  readonly kind = "not_found";
  readonly errcode = "ORDER_NOT_FOUND";

  constructor(id: string) {
    super(`Aucune commande avec l'id ${id}`);
  }
}

export class OrderStatusError extends DomainError {
  readonly kind = "conflict";
  readonly errcode = "ORDER_INVALID_STATUS";

  constructor(action: string, status: string) {
    super(`Impossible de ${action} une commande au statut "${status}"`);
  }
}

/** L'utilisateur voit la commande (acheteur ou vendeur) mais n'a pas le rôle requis pour cette action. */
export class OrderActionForbiddenError extends DomainError {
  readonly kind = "forbidden";
  readonly errcode = "ORDER_ACTION_FORBIDDEN";
}
