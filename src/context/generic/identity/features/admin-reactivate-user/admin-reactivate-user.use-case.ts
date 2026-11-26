import { Injectable } from "@nestjs/common";
import { EventBus } from "@core/events/event-bus.js";
import type { UserAdminView } from "../../domain/user.js";
import { UserRepository } from "../../domain/user.repository.js";
import { UserReactivated } from "../../public/events/user-reactivated.event.js";

/** Ses annonces retirées à la suspension restent en brouillon : c'est à lui de les republier. */
@Injectable()
export class AdminReactivateUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly events: EventBus,
  ) {}

  async execute(actorId: string, userId: string): Promise<UserAdminView> {
    const actor = await this.users.getById(actorId);
    const user = await this.users.getById(userId);

    user.reactivate(actor);
    await this.users.save(user);
    this.events.publish(new UserReactivated(user.id));
    return user.toAdminView();
  }
}
