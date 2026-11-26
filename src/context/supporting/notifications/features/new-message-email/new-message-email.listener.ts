import { Injectable, type OnModuleInit } from "@nestjs/common";
import { MessageSent } from "@messaging";
import { EventBus } from "@core/events/event-bus.js";
import { frontLink } from "../../common/format.js";
import { UserNotifier } from "../../common/user-notifier.js";

@Injectable()
export class NewMessageEmailListener implements OnModuleInit {
  constructor(
    private readonly events: EventBus,
    private readonly notifier: UserNotifier,
  ) {}

  onModuleInit() {
    this.events.subscribe(MessageSent, (event) => this.handle(event));
  }

  async handle(event: MessageSent): Promise<void> {
    await this.notifier.notify(
      event.recipientId,
      `Nouveau message à propos de "${event.listingTitle}"`,
      (name) => `Salut ${name},\n\n« ${event.preview} »\n\nRéponds ici : ${frontLink(`/conversations/${event.conversationId}`)}`,
    );
  }
}
