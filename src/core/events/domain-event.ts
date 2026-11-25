/**
 * Base de tous les événements : un fait métier déjà arrivé, nommé au passé (OrderPaid, UserRegistered).
 * Un événement ne transporte que des valeurs simples (ids, montants, textes), jamais d'entité.
 * Chaque contexte définit ses propres événements dans public/events/ et les expose via sa public-api.
 */
export abstract class DomainEvent {
  readonly occurredAt = new Date();
}
