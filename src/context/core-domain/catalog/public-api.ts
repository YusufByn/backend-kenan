// Seul point d'entrée du contexte catalog (alias "@catalog").
export { CatalogModule } from "./catalog.module.js";

// Lire des annonces depuis un autre contexte.
export { ListingQueries } from "./public/listing-queries.js";
export type { ListingSummary } from "./public/listing-queries.js";

// Réserver / libérer / vendre des annonces (utilisé par ordering).
export { ListingReservations } from "./public/listing-reservations.js";

// Événements publiés par catalog (à écouter avec EventBus.subscribe).
export { ListingPriceDropped } from "./public/events/listing-price-dropped.event.js";
