import { Global, Module } from "@nestjs/common";
import { EventBus } from "./event-bus.js";
import { InMemoryEventBus } from "./in-memory-event-bus.js";

/** Global : importé une seule fois dans AppModule, EventBus est injectable partout. */
@Global()
@Module({
  providers: [{ provide: EventBus, useClass: InMemoryEventBus }],
  exports: [EventBus],
})
export class EventsModule {}
