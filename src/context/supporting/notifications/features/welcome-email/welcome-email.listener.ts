import { Injectable, type OnModuleInit } from "@nestjs/common";
import { UserRegistered } from "@identity";
import { EventBus } from "@core/events/event-bus.js";
import { UserNotifier } from "../../common/user-notifier.js";

@Injectable()
export class WelcomeEmailListener implements OnModuleInit {
  constructor(
    private readonly events: EventBus,
    private readonly notifier: UserNotifier,
  ) {}

  onModuleInit() {
    this.events.subscribe(UserRegistered, (event) => this.handle(event));
  }

  async handle(event: UserRegistered): Promise<void> {
    await this.notifier.notify(
      event.userId,
      "Bienvenue sur la marketplace",
      (name) => `Salut ${name},\n\nTon compte est créé. Tu peux publier ton premier vélo ou chercher le prochain.`,
    );
  }
}
