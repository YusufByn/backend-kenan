import { DomainError } from "@core/errors/domain-error.js";

export class InvalidMessageError extends DomainError {
  readonly kind = "invalid";
  readonly errcode = "MESSAGE_INVALID";
}

/** Conversation inconnue, ou dont on ne fait pas partie (même réponse : on ne révèle pas qu'elle existe). */
export class ConversationNotFoundError extends DomainError {
  readonly kind = "not_found";
  readonly errcode = "CONVERSATION_NOT_FOUND";

  constructor(id: string) {
    super(`Aucune conversation avec l'id ${id}`);
  }
}

/** Annonce inconnue, en brouillon, archivée, ou plus en vente : on ne peut pas ouvrir de conversation dessus. */
export class ListingNotOpenForContactError extends DomainError {
  readonly kind = "conflict";
  readonly errcode = "LISTING_NOT_OPEN_FOR_CONTACT";

  constructor() {
    super("Cette annonce n'est plus en vente : impossible de contacter le vendeur", "listingId");
  }
}

export class CannotMessageYourselfError extends DomainError {
  readonly kind = "invalid";
  readonly errcode = "CANNOT_MESSAGE_YOURSELF";

  constructor() {
    super("C'est ta propre annonce : tu ne peux pas t'écrire à toi-même", "listingId");
  }
}
