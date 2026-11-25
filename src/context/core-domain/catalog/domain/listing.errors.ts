import { DomainError } from "@core/errors/domain-error.js";

export class InvalidListingError extends DomainError {
  readonly kind = "invalid";
  readonly errcode = "LISTING_INVALID";
}

export class ListingNotFoundError extends DomainError {
  readonly kind = "not_found";
  readonly errcode = "LISTING_NOT_FOUND";

  constructor(id: string) {
    super(`Aucune annonce avec l'id ${id}`);
  }
}

export class ListingNotAvailableError extends DomainError {
  readonly kind = "conflict";
  readonly errcode = "LISTING_NOT_AVAILABLE";

  constructor() {
    super("Cette annonce n'est plus disponible");
  }
}

export class ListingStatusError extends DomainError {
  readonly kind = "conflict";
  readonly errcode = "LISTING_INVALID_STATUS";

  constructor(action: string, status: string) {
    super(`Impossible de ${action} une annonce au statut "${status}"`);
  }
}

/** Le statut a changé en base entre la lecture et l'écriture (deux requêtes en même temps). */
export class ListingConcurrentUpdateError extends DomainError {
  readonly kind = "conflict";
  readonly errcode = "LISTING_CONCURRENT_UPDATE";

  constructor() {
    super("Cette annonce vient d'être modifiée par une autre requête, réessaie");
  }
}
