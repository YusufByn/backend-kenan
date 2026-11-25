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
