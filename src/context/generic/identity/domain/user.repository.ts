import { User } from "./user.entity.js";
import { EmailAlreadyUsedError, UserNotFoundError } from "./user.errors.js";

/**
 * Port : le domaine dit ce dont il a besoin, l'infrastructure fournit l'implémentation.
 * Abstract class (et pas interface) pour servir directement de token d'injection Nest.
 */
export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;
  /** `email` doit déjà être normalisé (User.normalizeEmail). */
  abstract findByEmail(email: string): Promise<User | null>;
  abstract save(user: User): Promise<void>;

  /** Partagé par get-me / update-me / get-public-profile : "introuvable = erreur" vit à un seul endroit. */
  async getById(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new UserNotFoundError(id);
    return user;
  }

  /** Partagé par register / update-me. `exceptUserId` : un user peut garder son propre email. */
  async assertEmailAvailable(email: string, exceptUserId?: string): Promise<void> {
    const owner = await this.findByEmail(User.normalizeEmail(email));
    if (owner && owner.id !== exceptUserId) throw new EmailAlreadyUsedError();
  }
}
