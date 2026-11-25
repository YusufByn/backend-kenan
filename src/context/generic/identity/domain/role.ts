/**
 * Rôles de plateforme, du moins au plus puissant. Chaque rôle a tous les droits de ceux qui le précèdent.
 * Acheteur et vendeur ne sont pas des rôles : ce sont des relations (qui possède l'annonce, qui a commandé),
 * vérifiées par chaque contexte.
 */
export const ROLES = ["user", "moderator", "admin"] as const;
export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = { user: 0, moderator: 1, admin: 2 };

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}

/** `role` donne-t-il au moins les droits de `required` ? (un admin a les droits d'un moderator) */
export function hasAtLeastRole(role: Role, required: Role): boolean {
  return RANK[role] >= RANK[required];
}

/** Strictement au-dessus : un moderator ne peut pas agir sur un autre moderator. */
export function outranks(role: Role, other: Role): boolean {
  return RANK[role] > RANK[other];
}
