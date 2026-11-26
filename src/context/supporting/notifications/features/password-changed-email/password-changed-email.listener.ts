import { Injectable, type OnModuleInit } from "@nestjs/common";
import { PasswordChanged } from "@identity";
import { EventBus } from "@core/events/event-bus.js";
import { UserNotifier } from "../../common/user-notifier.js";

/** Alerte de sécurité : si ce n'est pas lui, le user le sait tout de suite. */
@Injectable()
export class PasswordChangedEmailListener implements OnModuleInit {
  constructor(
    private readonly events: EventBus,
    private readonly notifier: UserNotifier,
  ) {}

  onModuleInit() {
    this.events.subscribe(PasswordChanged, (event) => this.handle(event));
  }

  async handle(event: PasswordChanged): Promise<void> {
    await this.notifier.notify(
      event.userId,
      "Ton mot de passe a été changé",
      (name) =>
        `Salut ${name},\n\nLe mot de passe de ton compte vient d'être changé, et tes autres appareils ont été déconnectés.\n` +
        `Si ce n'est pas toi, utilise "mot de passe oublié" tout de suite pour reprendre la main.`,
    );
  }
}
