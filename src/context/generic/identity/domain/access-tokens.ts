/** Ce que prouve un access token : qui est connecté, et depuis quelle session. */
export type AccessTokenClaims = { userId: string; sessionId: string };

/** Port : délivrer et vérifier le jeton qui prouve qui est connecté. Le format (JWT) est un détail d'infrastructure. */
export abstract class AccessTokens {
  abstract issue(claims: AccessTokenClaims): Promise<string>;
  /** Renvoie les claims si le jeton est valide et non expiré, sinon null. Ne vérifie pas que la session est encore ouverte. */
  abstract verify(token: string): Promise<AccessTokenClaims | null>;
}
