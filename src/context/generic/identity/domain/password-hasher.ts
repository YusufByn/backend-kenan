/** Port : hacher et vérifier un mot de passe. L'algorithme est un détail d'infrastructure. */
export abstract class PasswordHasher {
  abstract hash(password: string): Promise<string>;
  abstract verify(password: string, hash: string): Promise<boolean>;
}
