/** Port : délivrer et vérifier le jeton qui prouve qui est connecté. Le format (JWT) est un détail d'infrastructure. */
export abstract class AccessTokens {
  abstract issue(userId: string): Promise<string>;
  /** Renvoie l'id du user si le jeton est valide et non expiré, sinon null. */
  abstract verify(token: string): Promise<string | null>;
}
