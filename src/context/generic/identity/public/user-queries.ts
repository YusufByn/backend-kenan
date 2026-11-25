import type { UserDto } from "./user.dto.js";

/** Contrat exposé aux autres contextes. Ils dépendent de ça, jamais de l'implémentation. */
export abstract class UserQueries {
  abstract findById(id: string): Promise<UserDto | null>;
}
