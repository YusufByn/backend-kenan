export type DomainErrorKind = "invalid" | "unauthorized" | "forbidden" | "not_found" | "conflict";

/** Erreurs par champ : { "priceCents": ["Le prix doit être..."], "shippingAddress.city": ["..."] }. */
export type FieldErrors = Record<string, string[]>;

/**
 * Base de toutes les erreurs métier, lancées par les services (handlers) et le domaine.
 * Pur TypeScript (aucun import Nest) : utilisable depuis n'importe quel domain/.
 * - `kind` : la couche HTTP en déduit le status, sans que le domaine connaisse HTTP.
 * - `errcode` : code stable que le front peut tester (ex. "LISTING_NOT_FOUND"), contrairement au message.
 * - `fields` : quels champs posent problème, quand l'erreur vient d'une donnée envoyée.
 */
export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;
  abstract readonly errcode: string;
  readonly fields: FieldErrors | null;

  /** `field` : nom du champ fautif (le message lui est associé), ou directement la liste des erreurs par champ. */
  constructor(message: string, field?: string | FieldErrors) {
    super(message);
    this.name = new.target.name;
    this.fields = typeof field === "string" ? { [field]: [message] } : (field ?? null);
  }
}
