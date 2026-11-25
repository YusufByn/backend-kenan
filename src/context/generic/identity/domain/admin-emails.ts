/**
 * Port : les emails des comptes qui sont toujours admin. Sert à créer le premier admin
 * sans intervention manuelle (la source, ADMIN_EMAILS dans le .env, est un détail d'infrastructure).
 */
export abstract class AdminEmails {
  /** Emails normalisés (User.normalizeEmail). */
  abstract list(): string[];

  /** `email` doit déjà être normalisé. */
  includes(email: string): boolean {
    return this.list().includes(email);
  }
}
