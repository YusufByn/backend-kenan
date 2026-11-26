import { DomainEvent } from "@core/events/domain-event.js";

/**
 * Un user a demandé à réinitialiser son mot de passe. `token` est le jeton en clair, à mettre dans le lien
 * envoyé par email : c'est le seul endroit où il existe (la base n'en garde que l'empreinte).
 * Ne jamais le logger ni le stocker ailleurs.
 */
export class PasswordResetRequested extends DomainEvent {
  constructor(
    readonly userId: string,
    readonly token: string,
    readonly expiresAt: Date,
  ) {
    super();
  }
}
