import { Injectable } from "@nestjs/common";
import { EventBus } from "@core/events/event-bus.js";
import { OneTimeTokenIssuer } from "../../domain/one-time-token-issuer.js";
import type { UserProfile } from "../../domain/user.js";
import { UserRepository } from "../../domain/user.repository.js";
import { EmailVerificationRequested } from "../../public/events/email-verification-requested.event.js";

/** Changer d'email le rend non vérifié : un lien de vérification part à la nouvelle adresse. */
@Injectable()
export class UpdateMeUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: OneTimeTokenIssuer,
    private readonly events: EventBus,
  ) {}

  async execute(userId: string, changes: { name?: string; email?: string }): Promise<UserProfile> {
    const user = await this.users.getById(userId);
    if (changes.email !== undefined) await this.users.assertEmailAvailable(changes.email, user.id);

    const { emailChanged } = user.update(changes);
    await this.users.save(user);

    if (emailChanged) {
      const { token, expiresAt } = await this.tokens.issue(user.id, "email_verification");
      this.events.publish(new EmailVerificationRequested(user.id, user.emailAddress, token, expiresAt));
    }
    return user.toProfile();
  }
}
