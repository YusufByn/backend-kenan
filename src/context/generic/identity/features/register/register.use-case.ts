import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { EventBus } from "@core/events/event-bus.js";
import { OneTimeTokenIssuer } from "../../domain/one-time-token-issuer.js";
import { PasswordHasher } from "../../domain/password-hasher.js";
import { ROLE_PRESETS } from "../../domain/role.js";
import { SessionIssuer, type AuthTokens, type ClientInfo } from "../../domain/session-issuer.js";
import { User, type UserProfile } from "../../domain/user.js";
import { UserRepository } from "../../domain/user.repository.js";
import { EmailVerificationRequested } from "../../public/events/email-verification-requested.event.js";
import { UserRegistered } from "../../public/events/user-registered.event.js";

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly issuer: SessionIssuer,
    private readonly events: EventBus,
    private readonly tokens: OneTimeTokenIssuer,
  ) {}

  /**
   * Toujours le preset "user", même pour une adresse de ADMIN_EMAILS : elle ne deviendra admin
   * qu'une fois l'email vérifié (VerifyEmailUseCase), pour prouver qu'on possède bien l'adresse.
   */

  async execute(
    input: { name: string; email: string; password: string },
    client: ClientInfo,
  ): Promise<{ user: UserProfile } & AuthTokens> {
    User.assertValidPassword(input.password);
    await this.users.assertEmailAvailable(input.email);

    const user = User.register({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: await this.hasher.hash(input.password),
      permissions: ROLE_PRESETS.user,
      createdAt: new Date(),
    });
    await this.users.save(user);
    const verification = await this.tokens.issue(user.id, "email_verification");
    this.events.publish(
      new UserRegistered(user.id),
      new EmailVerificationRequested(user.id, user.emailAddress, verification.token, verification.expiresAt),
    );

    // Connecté directement après l'inscription : une première session est ouverte.
    return { user: user.toProfile(), ...(await this.issuer.open(user.id, client)) };
  }
}
