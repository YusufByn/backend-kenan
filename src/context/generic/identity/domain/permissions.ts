import { combine, hasAll } from "@core/bitmask/bitmask.js";

/**
 * Catalogue des permissions : une permission = un bit dans le masque du user.
 * SOURCE UNIQUE. Règles :
 * - Nommer par domaine : <DOMAINE>_<ACTION>.
 * - Ne jamais changer ni réutiliser le bit d'une permission, même supprimée : les masques
 *   déjà enregistrés en base donneraient ce bit à des gens qui ne l'ont jamais reçu.
 *   Pour supprimer : retirer la ligne et la noter dans « Bits retirés » ci-dessous.
 * - « owner » : le contexte qui vérifie la permission. identity ne connaît que son nom,
 *   jamais le code du contexte propriétaire.
 *
 * | Bit | Permission               | Owner    | Donne le droit de                                  |
 * |-----|--------------------------|----------|----------------------------------------------------|
 * | 0   | LISTING_SELL             | catalog  | Créer, modifier, publier ses annonces              |
 * | 1   | ORDER_PLACE              | ordering | Remplir son panier et passer commande              |
 * | 2   | REVIEW_CREATE            | reviews  | Noter un vendeur après livraison                   |
 * | 3   | MESSAGE_SEND             | messaging| Écrire aux vendeurs / acheteurs (retirable = muet) |
 * | 16  | USERS_READ               | identity | Lister les comptes (GET /admin/users)              |
 * | 17  | USERS_SUSPEND            | identity | Suspendre / réactiver un compte                    |
 * | 18  | USERS_MANAGE_PERMISSIONS | identity | Changer les permissions d'un compte                |
 * | 19  | LISTINGS_MODERATE        | catalog  | Retirer l'annonce de n'importe quel vendeur        |
 * | 20  | ORDERS_READ_ALL          | ordering | Consulter toutes les commandes (support)           |
 * | 21  | REVIEWS_MODERATE         | reviews  | Retirer un avis abusif                             |
 *
 * Bits 0-15 : marketplace. Bits 16+ : modération.
 * Bits retirés (ne pas réutiliser) : aucun.
 */
export const PERMISSIONS = {
  LISTING_SELL: 1n << 0n,
  ORDER_PLACE: 1n << 1n,
  REVIEW_CREATE: 1n << 2n,
  MESSAGE_SEND: 1n << 3n,

  USERS_READ: 1n << 16n,
  USERS_SUSPEND: 1n << 17n,
  USERS_MANAGE_PERMISSIONS: 1n << 18n,
  LISTINGS_MODERATE: 1n << 19n,
  ORDERS_READ_ALL: 1n << 20n,
  REVIEWS_MODERATE: 1n << 21n,
} as const;

export type PermissionName = keyof typeof PERMISSIONS;
export const PERMISSION_NAMES = Object.keys(PERMISSIONS) as PermissionName[];

/** Toutes les permissions existantes. */
export const ALL_PERMISSIONS = combine(Object.values(PERMISSIONS));

export function isPermissionName(value: string): value is PermissionName {
  return Object.hasOwn(PERMISSIONS, value);
}

/** ["LISTING_SELL", "ORDER_PLACE"] → 0b11n. L'API et les décorateurs parlent en noms, la base en bits. */
export function toMask(names: readonly PermissionName[]): bigint {
  return combine(names.map((name) => PERMISSIONS[name]));
}

/** 0b11n → ["LISTING_SELL", "ORDER_PLACE"]. Les bits retirés du catalogue sont ignorés. */
export function toNames(mask: bigint): PermissionName[] {
  return PERMISSION_NAMES.filter((name) => hasAll(mask, PERMISSIONS[name]));
}
