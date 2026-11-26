import { Injectable } from "@nestjs/common";
import { EventBus } from "@core/events/event-bus.js";
import { PasswordHasher } from "../../domain/password-hasher.js";
import { OneTimeTokenRepository } from "../../domain/one-time-token.repository.js";
import { SessionRepository } from "../../domain/session.repository.js";
import { User } from "../../domain/user.js";
import { IncorrectPasswordError } from "../../domain/user.errors.js";
import { UserRepository } from "../../domain/user.repository.js";
import { PasswordChanged } from "../../public/events/password-changed.event.js";

/**
 * Il faut le mot de passe actuel : un token volé ne suffit pas à prendre le compte.
 * Les autres appareils sont déconnectés et les liens de reset en cours annulés ; la session de la requête reste ouverte.
 */
@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly sessions: SessionRepository,
    private readonly tokens: OneTimeTokenRepository,
    private readonly events: EventBus,
  ) {}

  async execute(userId: string, sessionId: string, input: { currentPassword: string; newPassword: string }): Promise<void> {
    const user = await this.users.getById(userId);
    if (!(await this.hasher.verify(input.currentPassword, user.passwordHash))) throw new IncorrectPasswordError();
    User.assertValidPassword(input.newPassword, "newPassword");

    user.changePassword(await this.hasher.hash(input.newPassword));
    await this.users.save(user);

    const now = new Date();
    await this.sessions.revokeAllForUser(user.id, now, sessionId);
    await this.tokens.invalidateAllForUser(user.id, "password_reset", now);
    this.events.publish(new PasswordChanged(user.id));
  }
}
