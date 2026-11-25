// Seul point d'entrée du contexte notifications (alias "@notifications").
// Rien d'autre à exposer : le contexte ne fait qu'écouter les événements du bus.
export { NotificationsModule } from "./notifications.module.js";
