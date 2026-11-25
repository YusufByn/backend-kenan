import type { DomainEvent } from "./domain-event.js";

export type EventType<E extends DomainEvent> = new (...args: any[]) => E;
export type EventListener<E extends DomainEvent> = (event: E) => Promise<void> | void;

/**
 * Port du bus d'événements. Le contexte qui émet ne connaît pas ceux qui écoutent.
 * - publish : à appeler une fois l'action enregistrée en base, jamais avant.
 * - subscribe : à appeler au démarrage (onModuleInit) par le contexte qui veut réagir.
 */
export abstract class EventBus {
  abstract publish(...events: DomainEvent[]): void;
  abstract subscribe<E extends DomainEvent>(type: EventType<E>, listener: EventListener<E>): void;
}
