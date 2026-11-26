import { DomainEvent } from "@core/events/domain-event.js";

/** La modération a levé une suspension. */
export class UserReactivated extends DomainEvent {
  constructor(readonly userId: string) {
    super();
  }
}
