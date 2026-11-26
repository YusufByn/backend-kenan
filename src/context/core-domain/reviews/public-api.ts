// Seul point d'entrée du contexte reviews (alias "@reviews").
export { ReviewsModule } from "./reviews.module.js";

// Événements publiés par reviews (à écouter avec EventBus.subscribe).
export { ReviewCreated, ReviewReplied } from "./public/events/review-events.js";
