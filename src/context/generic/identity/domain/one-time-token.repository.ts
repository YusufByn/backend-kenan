import type { OneTimeToken, TokenPurpose } from "./one-time-token.js";

/** Port : stocker / retrouver les jetons à usage unique. */
export abstract class OneTimeTokenRepository {
  abstract findByHash(purpose: TokenPurpose, tokenHash: string): Promise<OneTimeToken | null>;
  abstract save(token: OneTimeToken): Promise<void>;
  /**
   * Marque le jeton utilisé, seulement s'il ne l'est pas déjà (mise à jour conditionnelle).
   * Renvoie false si une autre requête l'a consommé entre-temps : un lien ne sert jamais deux fois.
   */
  abstract markUsed(id: string, now: Date): Promise<boolean>;
  /** Rend inutilisables les jetons encore ouverts du user pour cet usage : seul le dernier lien envoyé marche. */
  abstract invalidateAllForUser(userId: string, purpose: TokenPurpose, now: Date): Promise<void>;
  /** Ménage : supprime les jetons expirés avant `before`. Renvoie le nombre de lignes supprimées. */
  abstract deleteExpiredBefore(before: Date): Promise<number>;
}
