import { Injectable, type OnModuleInit } from "@nestjs/common";
import { PasswordResetRequested } from "@identity";
import { EventBus } from "@core/events/event-bus.js";
import { formatDateTime, frontLink } from "../../common/format.js";
import { UserNotifier } from "../../common/user-notifier.js";

@Injectable()
export class PasswordResetEmailListener implements OnModuleInit {
  constructor(
    private readonly events: EventBus,
    private readonly notifier: UserNotifier,
  ) {}

  onModuleInit() {
    this.events.subscribe(PasswordResetRequested, (event) => this.handle(event));
  }

  async handle(event: PasswordResetRequested): Promise<void> {
    const link = frontLink(`/reset-password?token=${encodeURIComponent(event.token)}`);
    await this.notifier.notify(
      event.userId,
      "Réinitialise ton mot de passe",
      (name) =>
        `Salut ${name},\n\nPour choisir un nouveau mot de passe, ouvre ce lien :\n${link}\n\n` +
        `Il est valable jusqu'au ${formatDateTime(event.expiresAt)} et ne sert qu'une fois.\n` +
        `Si tu n'as rien demandé, ignore cet email : ton mot de passe actuel reste valable.`,
    );
  }
}
