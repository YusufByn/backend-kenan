// Seul point d'entrée du contexte ordering (alias "@ordering").
export { OrderingModule } from "./ordering.module.js";

// Lire une commande depuis un autre contexte (utilisé par reviews).
export { OrderQueries } from "./public/order-queries.js";
export type { OrderSummary } from "./public/order-queries.js";

// Événements publiés par ordering, une fois la commande enregistrée (à écouter avec EventBus.subscribe).
export {
  OrderEvent,
  OrderPlaced,
  OrderPaid,
  OrderShipped,
  OrderDelivered,
  OrderCancelled,
  OrderExpired,
} from "./public/events/order-events.js";
export type { CancellationReason } from "./public/events/order-events.js";
