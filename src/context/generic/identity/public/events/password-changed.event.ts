import { DomainEvent } from "@core/events/domain-event.js";

/** Le mot de passe d'un user vient de changer (depuis son compte ou via un lien de reset). Sert à le prévenir. */
export class PasswordChanged extends DomainEvent {
  constructor(readonly userId: string) {
    super();
  }
}
