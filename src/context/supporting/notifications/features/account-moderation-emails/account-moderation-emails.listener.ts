import { Injectable, type OnModuleInit } from "@nestjs/common";
import { UserReactivated, UserSuspended } from "@identity";
import { EventBus } from "@core/events/event-bus.js";
import { UserNotifier } from "../../common/user-notifier.js";

/** Le user apprend ce qui arrive à son compte, plutôt que de découvrir un 403 à sa prochaine connexion. */
@Injectable()
export class AccountModerationEmailsListener implements OnModuleInit {
  constructor(
    private readonly events: EventBus,
    private readonly notifier: UserNotifier,
  ) {}

  onModuleInit() {
    this.events.subscribe(UserSuspended, (event) => this.suspended(event));
    this.events.subscribe(UserReactivated, (event) => this.reactivated(event));
  }

  async suspended(event: UserSuspended): Promise<void> {
    await this.notifier.notify(
      event.userId,
      "Ton compte est suspendu",
      (name) =>
        `Salut ${name},\n\nTon compte a été suspendu par la modération. Tes annonces en ligne ont été retirées de la vente ` +
        `et tes commandes pas encore expédiées ont été annulées.\n\nSi tu penses que c'est une erreur, réponds à cet email.`,
    );
  }

  async reactivated(event: UserReactivated): Promise<void> {
    await this.notifier.notify(
      event.userId,
      "Ton compte est réactivé",
      (name) => `Salut ${name},\n\nTon compte est de nouveau actif. Reconnecte-toi, puis republie tes annonces depuis "Mes annonces" (elles sont en brouillon).`,
    );
  }
}
