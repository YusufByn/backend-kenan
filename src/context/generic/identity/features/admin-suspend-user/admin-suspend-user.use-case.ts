import { Injectable } from "@nestjs/common";
import { EventBus } from "@core/events/event-bus.js";
import { SessionRepository } from "../../domain/session.repository.js";
import type { UserAdminView } from "../../domain/user.js";
import { UserRepository } from "../../domain/user.repository.js";
import { UserSuspended } from "../../public/events/user-suspended.event.js";

/**
 * Effet immédiat : JwtAuthGuard relit le user à chaque requête, ses tokens déjà délivrés ne passent plus.
 * Ses sessions sont aussi fermées : une réactivation ne le reconnecte pas tout seul, il devra se reloguer.
 * UserSuspended : catalog retire ses annonces de la vente, notifications le prévient.
 */
@Injectable()
export class AdminSuspendUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly sessions: SessionRepository,
    private readonly events: EventBus,
  ) {}

  async execute(actorId: string, userId: string): Promise<UserAdminView> {
    const actor = await this.users.getById(actorId);
    const user = await this.users.getById(userId);

    const now = new Date();
    user.suspend(actor, now);
    await this.users.save(user);
    await this.sessions.revokeAllForUser(user.id, now);
    this.events.publish(new UserSuspended(user.id, actor.id));
    return user.toAdminView();
  }
}
