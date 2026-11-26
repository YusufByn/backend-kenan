import { Injectable } from "@nestjs/common";
import { EventBus } from "@core/events/event-bus.js";
import { OneTimeTokenIssuer } from "../../domain/one-time-token-issuer.js";
import { PasswordHasher } from "../../domain/password-hasher.js";
import { SessionRepository } from "../../domain/session.repository.js";
import { User } from "../../domain/user.js";
import { InvalidResetTokenError } from "../../domain/user.errors.js";
import { UserRepository } from "../../domain/user.repository.js";
import { PasswordChanged } from "../../public/events/password-changed.event.js";

/**
 * Nouveau mot de passe via le lien reçu par email. Toutes les sessions sont fermées (si quelqu'un d'autre
 * était connecté, il est sorti) ; le user se reconnecte ensuite avec POST /auth/login.
 */
@Injectable()
export class ResetPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: OneTimeTokenIssuer,
    private readonly sessions: SessionRepository,
    private readonly events: EventBus,
  ) {}

  async execute(input: { token: string; newPassword: string }): Promise<void> {
    User.assertValidPassword(input.newPassword, "newPassword");

    const now = new Date();
    const token = await this.tokens.consume("password_reset", input.token, now);
    if (!token) throw new InvalidResetTokenError();

    const user = await this.users.findById(token.userId);
    if (!user) throw new InvalidResetTokenError();
    user.assertActive();

    user.changePassword(await this.hasher.hash(input.newPassword));
    await this.users.save(user);
    await this.sessions.revokeAllForUser(user.id, now);
    this.events.publish(new PasswordChanged(user.id));
  }
}
