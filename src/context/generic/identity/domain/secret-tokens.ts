/**
 * Port : jetons opaques aléatoires (secret du refresh token, lien de reset du mot de passe).
 * Seule leur empreinte est stockée : une fuite de la base ne donne aucun jeton utilisable.
 */
export abstract class SecretTokens {
  /** Un nouveau jeton aléatoire, sûr à mettre dans une URL. */
  abstract generate(): string;
  /** Empreinte à stocker et à chercher en base. Toujours la même pour un même jeton. */
  abstract fingerprint(token: string): string;
  /** Le jeton correspond-il à l'empreinte ? Comparaison en temps constant. */
  abstract matches(token: string, fingerprint: string): boolean;
}
