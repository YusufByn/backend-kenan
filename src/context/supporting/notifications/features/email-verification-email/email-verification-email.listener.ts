import { Injectable, type OnModuleInit } from "@nestjs/common";
import { EmailVerificationRequested, UserQueries } from "@identity";
import { EventBus } from "@core/events/event-bus.js";
import { formatDateTime, frontLink } from "../../common/format.js";
import { Mailer } from "../../domain/mailer.js";

/** Envoyé à l'adresse à vérifier (celle de l'événement) : après un changement d'email, ce n'est plus celle du compte d'avant. */
@Injectable()
export class EmailVerificationEmailListener implements OnModuleInit {
  constructor(
    private readonly events: EventBus,
    private readonly users: UserQueries,
    private readonly mailer: Mailer,
  ) {}

  onModuleInit() {
    this.events.subscribe(EmailVerificationRequested, (event) => this.handle(event));
  }

  async handle(event: EmailVerificationRequested): Promise<void> {
    const user = await this.users.findById(event.userId);
    const link = frontLink(`/verify-email?token=${encodeURIComponent(event.token)}`);
    await this.mailer.send({
      to: event.email,
      subject: "Confirme ton adresse email",
      text:
        `Salut ${user?.name ?? ""},\n\nConfirme ton adresse en ouvrant ce lien :\n${link}\n\n` +
        `Il est valable jusqu'au ${formatDateTime(event.expiresAt)}. Si tu n'as pas créé de compte, ignore cet email.`,
    });
  }
}
