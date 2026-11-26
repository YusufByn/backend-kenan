import { Injectable } from "@nestjs/common";
import { EventBus } from "@core/events/event-bus.js";
import { OneTimeTokenIssuer } from "../../domain/one-time-token-issuer.js";
import { User } from "../../domain/user.js";
import { UserRepository } from "../../domain/user.repository.js";
import { PasswordResetRequested } from "../../public/events/password-reset-requested.event.js";

/**
 * Envoie un lien de réinitialisation par email (via l'événement PasswordResetRequested, écouté par notifications).
 * Répond toujours la même chose, que l'email existe ou non : on ne révèle pas quels comptes existent.
 * Une nouvelle demande annule les liens précédents.
 */
@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: OneTimeTokenIssuer,
    private readonly events: EventBus,
  ) {}

  async execute(input: { email: string }): Promise<void> {
    const user = await this.users.findByEmail(User.normalizeEmail(input.email));
    // Compte suspendu : rien n'est envoyé, il ne pourrait de toute façon pas se connecter.
    if (!user || user.isSuspended) return;

    const { token, expiresAt } = await this.tokens.issue(user.id, "password_reset");
    this.events.publish(new PasswordResetRequested(user.id, token, expiresAt));
  }
}
