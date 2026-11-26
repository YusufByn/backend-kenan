import { ALL_PERMISSIONS, PERMISSIONS as P } from "./permissions.js";

/**
 * Un rôle n'est qu'un raccourci : un masque de permissions prêt à l'emploi.
 * Ce qui est enregistré sur le user et vérifié à chaque requête, c'est le masque, pas le nom du rôle.
 * On peut ensuite ajouter / retirer des permissions une par une (un user qui ne peut plus vendre, par exemple).
 */
export const ROLES = ["user", "moderator", "admin"] as const;
export type Role = (typeof ROLES)[number];

const USER = P.LISTING_SELL | P.ORDER_PLACE | P.REVIEW_CREATE | P.MESSAGE_SEND;
const MODERATOR = USER | P.USERS_READ | P.USERS_SUSPEND | P.LISTINGS_MODERATE | P.ORDERS_READ_ALL | P.REVIEWS_MODERATE;

export const ROLE_PRESETS: Record<Role, bigint> = {
  user: USER,
  moderator: MODERATOR,
  admin: ALL_PERMISSIONS,
};

/** Le rôle dont le masque correspond exactement, ou null si les permissions ont été personnalisées. */
export function roleOf(mask: bigint): Role | null {
  return ROLES.find((role) => ROLE_PRESETS[role] === mask) ?? null;
}
