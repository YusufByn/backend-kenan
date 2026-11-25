import { Injectable, Logger } from "@nestjs/common";
import type { DomainEvent } from "./domain-event.js";
import { EventBus, type EventListener, type EventType } from "./event-bus.js";

/**
 * Bus en mémoire, dans le même process que l'API.
 * - publish ne bloque pas : la requête HTTP répond sans attendre les listeners.
 * - Un listener qui plante est loggé et n'affecte ni la requête ni les autres listeners.
 * Limite : si le serveur s'arrête juste après publish, les listeners pas encore exécutés sont perdus.
 */
@Injectable()
export class InMemoryEventBus extends EventBus {
  private readonly logger = new Logger("EventBus");
  private readonly listeners = new Map<EventType<DomainEvent>, EventListener<DomainEvent>[]>();

  subscribe<E extends DomainEvent>(type: EventType<E>, listener: EventListener<E>): void {
    const current = this.listeners.get(type) ?? [];
    this.listeners.set(type, [...current, listener as EventListener<DomainEvent>]);
  }

  publish(...events: DomainEvent[]): void {
    for (const event of events) {
      const type = event.constructor as EventType<DomainEvent>;
      for (const listener of this.listeners.get(type) ?? []) {
        // setImmediate : le listener tourne plus tard, la requête en cours ne l'attend pas.
        setImmediate(() => {
          Promise.resolve()
            .then(() => listener(event))
            .catch((error: unknown) => {
              const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
              this.logger.error(`Listener de ${type.name} en échec : ${detail}`);
            });
        });
      }
    }
  }
}
