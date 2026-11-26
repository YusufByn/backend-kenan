import { Injectable, type OnModuleInit } from "@nestjs/common";
import { ReviewCreated, ReviewReplied } from "@reviews";
import { EventBus } from "@core/events/event-bus.js";
import { frontLink } from "../../common/format.js";
import { UserNotifier } from "../../common/user-notifier.js";

/** Vendeur : nouvel avis (il peut y répondre). Acheteur : le vendeur a répondu à son avis. */
@Injectable()
export class ReviewEmailsListener implements OnModuleInit {
  constructor(
    private readonly events: EventBus,
    private readonly notifier: UserNotifier,
  ) {}

  onModuleInit() {
    this.events.subscribe(ReviewCreated, (event) => this.created(event));
    this.events.subscribe(ReviewReplied, (event) => this.replied(event));
  }

  async created(event: ReviewCreated): Promise<void> {
    await this.notifier.notify(
      event.sellerId,
      `Nouvel avis : ${"★".repeat(event.rating)}${"☆".repeat(5 - event.rating)}`,
      (name) => `Salut ${name},\n\nUn acheteur t'a laissé une note de ${event.rating}/5. Tu peux lui répondre publiquement :\n${frontLink(`/sellers/${event.sellerId}/reviews`)}`,
    );
  }

  async replied(event: ReviewReplied): Promise<void> {
    await this.notifier.notify(
      event.buyerId,
      "Le vendeur a répondu à ton avis",
      (name) => `Salut ${name},\n\nLe vendeur a répondu à ton avis :\n${frontLink(`/sellers/${event.sellerId}/reviews`)}`,
    );
  }
}
