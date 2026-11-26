import { Injectable } from "@nestjs/common";
import { EventBus } from "@core/events/event-bus.js";
import { OneTimeTokenIssuer } from "../../domain/one-time-token-issuer.js";
import { UserRepository } from "../../domain/user.repository.js";
import { EmailVerificationRequested } from "../../public/events/email-verification-requested.event.js";

/** Renvoie un lien de vérification (email perdu ou expiré). Le lien précédent ne marche plus. */
@Injectable()
export class ResendVerificationUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly tokens: OneTimeTokenIssuer,
    private readonly events: EventBus,
  ) {}

  async execute(userId: string): Promise<void> {
    const user = await this.users.getById(userId);
    user.assertEmailNotVerified();

    const { token, expiresAt } = await this.tokens.issue(user.id, "email_verification");
    this.events.publish(new EmailVerificationRequested(user.id, user.emailAddress, token, expiresAt));
  }
}
