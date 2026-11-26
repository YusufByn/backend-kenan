import { DomainEvent } from "@core/events/domain-event.js";

/** La modération a suspendu un compte. catalog retire ses annonces de la vente, notifications le prévient. */
export class UserSuspended extends DomainEvent {
  constructor(
    readonly userId: string,
    readonly suspendedBy: string,
  ) {
    super();
  }
}
