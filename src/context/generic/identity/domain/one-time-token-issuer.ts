import { randomUUID } from "node:crypto";
import { OneTimeToken, type TokenPurpose } from "./one-time-token.js";
import { OneTimeTokenRepository } from "./one-time-token.repository.js";
import { SecretTokens } from "./secret-tokens.js";

/** Un jeton prêt à être envoyé par email. `token` est en clair : à mettre dans le lien, nulle part ailleurs. */
export type IssuedToken = { token: string; expiresAt: Date };

/**
 * Crée un jeton à usage unique et annule les précédents du même usage.
 * Partagé par register, update-me, resend-verification (vérification d'email) et forgot-password (reset).
 */
export class OneTimeTokenIssuer {
  constructor(
    private readonly tokens: OneTimeTokenRepository,
    private readonly secrets: SecretTokens,
  ) {}

  async issue(userId: string, purpose: TokenPurpose): Promise<IssuedToken> {
    const now = new Date();
    await this.tokens.invalidateAllForUser(userId, purpose, now);

    const token = this.secrets.generate();
    const issued = OneTimeToken.issue({ id: randomUUID(), userId, purpose, tokenHash: this.secrets.fingerprint(token), now });
    await this.tokens.save(issued);
    return { token, expiresAt: issued.expiresAt };
  }

  /**
   * Consomme le jeton reçu dans un lien. null s'il est inconnu, expiré, déjà utilisé ou remplacé :
   * le use case lève alors l'erreur de son cas (reset ou vérification), sans en dire plus.
   */
  async consume(purpose: TokenPurpose, token: string, now: Date): Promise<OneTimeToken | null> {
    const found = await this.tokens.findByHash(purpose, this.secrets.fingerprint(token));
    if (!found || !found.isUsable(now)) return null;
    return (await this.tokens.markUsed(found.id, now)) ? found : null;
  }
}
