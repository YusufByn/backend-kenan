import { DomainEvent } from "@core/events/domain-event.js";

/**
 * Un lien de vérification doit être envoyé à `email` (inscription, changement d'email, ou renvoi demandé).
 * `email` est transporté car c'est la nouvelle adresse à vérifier. `token` est en clair : ne jamais le logger.
 */
export class EmailVerificationRequested extends DomainEvent {
  constructor(
    readonly userId: string,
    readonly email: string,
    readonly token: string,
    readonly expiresAt: Date,
  ) {
    super();
  }
}
