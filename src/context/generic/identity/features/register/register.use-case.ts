import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { EventBus } from "@core/events/event-bus.js";
import { AccessTokens } from "../../domain/access-tokens.js";
import { AdminEmails } from "../../domain/admin-emails.js";
import { PasswordHasher } from "../../domain/password-hasher.js";
import { ROLE_PRESETS } from "../../domain/role.js";
import { User, type UserProfile } from "../../domain/user.js";
import { UserRepository } from "../../domain/user.repository.js";
import { UserRegistered } from "../../public/events/user-registered.event.js";

@Injectable()
export class RegisterUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: AccessTokens,
    private readonly events: EventBus,
    private readonly adminEmails: AdminEmails,
  ) {}

  async execute(input: { name: string; email: string; password: string }): Promise<{ user: UserProfile; accessToken: string }> {
    User.assertValidPassword(input.password);
    await this.users.assertEmailAvailable(input.email);

    const user = User.register({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: await this.hasher.hash(input.password),
      permissions: ROLE_PRESETS[this.adminEmails.includes(User.normalizeEmail(input.email)) ? "admin" : "user"],
      createdAt: new Date(),
    });
    await this.users.save(user);
    this.events.publish(new UserRegistered(user.id));

    // Connecté directement après l'inscription.
    return { user: user.toProfile(), accessToken: await this.tokens.issue(user.id) };
  }
}
