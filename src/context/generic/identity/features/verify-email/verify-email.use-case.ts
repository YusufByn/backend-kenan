import { Injectable, Logger } from "@nestjs/common";
import { AdminEmails } from "../../domain/admin-emails.js";
import { OneTimeTokenIssuer } from "../../domain/one-time-token-issuer.js";
import type { UserProfile } from "../../domain/user.js";
import { InvalidVerificationTokenError } from "../../domain/user.errors.js";
import { UserRepository } from "../../domain/user.repository.js";

/**
 * Le user clique sur le lien reçu : son adresse est vérifiée. Public : on peut ouvrir le lien sur un
 * autre appareil que celui où l'on est connecté. Si l'adresse est dans ADMIN_EMAILS, le compte devient admin
 * maintenant, et pas à l'inscription : il faut prouver qu'on possède l'adresse.
 */
@Injectable()
export class VerifyEmailUseCase {
  private readonly logger = new Logger("VerifyEmail");

  constructor(
    private readonly users: UserRepository,
    private readonly tokens: OneTimeTokenIssuer,
    private readonly adminEmails: AdminEmails,
  ) {}

  async execute(input: { token: string }): Promise<UserProfile> {
    const now = new Date();
    const token = await this.tokens.consume("email_verification", input.token, now);
    if (!token) throw new InvalidVerificationTokenError();

    const user = await this.users.findById(token.userId);
    if (!user) throw new InvalidVerificationTokenError();

    user.verifyEmail(now);
    if (this.adminEmails.includes(user.emailAddress) && user.grantBootstrapAdmin()) {
      this.logger.log(`${user.emailAddress} est admin (ADMIN_EMAILS, email vérifié)`);
    }
    await this.users.save(user);
    return user.toProfile();
  }
}
