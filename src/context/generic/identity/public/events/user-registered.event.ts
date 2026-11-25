import { DomainEvent } from "@core/events/domain-event.js";

/** Un compte vient d'être créé. Pour lire son nom ou son email : UserQueries. */
export class UserRegistered extends DomainEvent {
  constructor(readonly userId: string) {
    super();
  }
}
