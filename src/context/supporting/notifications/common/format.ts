import { env } from "@core/config/env.js";

/** 119000 → "1 190,00 €" */
export function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
}

/** Référence courte d'une commande, lisible dans un email. */
export function orderRef(orderId: string): string {
  return orderId.slice(0, 8).toUpperCase();
}

export function itemList(titles: string[]): string {
  return titles.map((title) => `- ${title}`).join("\n");
}

/** Date → "26/11/2026 14:05" (heure de Paris). */
export function formatDateTime(date: Date): string {
  return date.toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" });
}

/** Lien vers une page du front : frontLink("/orders/abc") → "http://localhost:5173/orders/abc". */
export function frontLink(path: string): string {
  return `${env.frontendUrl}${path}`;
}
