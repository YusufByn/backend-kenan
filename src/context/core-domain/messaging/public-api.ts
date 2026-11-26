// Seul point d'entrée du contexte messaging (alias "@messaging").
export { MessagingModule } from "./messaging.module.js";

// Événements publiés par messaging (à écouter avec EventBus.subscribe).
export { MessageSent } from "./public/events/message-sent.event.js";
