import { Injectable, Logger } from "@nestjs/common";
import { UserQueries } from "@identity";
import { Mailer } from "../domain/mailer.js";

/** Utilisé par tous les listeners : retrouve l'email du user via identity, puis envoie. */
@Injectable()
export class UserNotifier {
  private readonly logger = new Logger(UserNotifier.name);

  constructor(
    private readonly users: UserQueries,
    private readonly mailer: Mailer,
  ) {}

  async notify(userId: string, subject: string, text: (name: string) => string): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) {
      this.logger.warn(`User ${userId} introuvable, email "${subject}" non envoyé`);
      return;
    }
    await this.mailer.send({ to: user.email, subject, text: text(user.name) });
  }
}
