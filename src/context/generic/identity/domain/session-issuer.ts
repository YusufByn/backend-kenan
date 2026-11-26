import { randomUUID } from "node:crypto";
import { AccessTokens } from "./access-tokens.js";
import { SecretTokens } from "./secret-tokens.js";
import { Session } from "./session.js";
import { InvalidRefreshTokenError } from "./session.errors.js";
import { SessionRepository } from "./session.repository.js";

/** Ce que le client reçoit à la connexion et à chaque refresh. */
export type AuthTokens = { accessToken: string; refreshToken: string };

/** D'où vient la connexion : affiché dans la liste des sessions pour que le user les reconnaisse. */
export type ClientInfo = { userAgent: string | null; ip: string | null };

/**
 * Ouvre et prolonge des sessions. Partagé par register, login et refresh-session.
 * Refresh token = "<sessionId>.<secret>" : l'id retrouve la session, le secret prouve qu'on la détient.
 */
export class SessionIssuer {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly secrets: SecretTokens,
    private readonly accessTokens: AccessTokens,
    private readonly sessionTtlMs: number,
  ) {}

  async open(userId: string, client: ClientInfo): Promise<AuthTokens> {
    const now = new Date();
    const secret = this.secrets.generate();
    const session = Session.open({
      id: randomUUID(),
      userId,
      refreshTokenHash: this.secrets.fingerprint(secret),
      userAgent: client.userAgent,
      ip: client.ip,
      now,
      expiresAt: new Date(now.getTime() + this.sessionTtlMs),
    });
    await this.sessions.save(session);
    return this.tokensFor(session, secret);
  }

  /**
   * Nouveau refresh token (l'ancien ne marche plus) et session prolongée.
   * InvalidRefreshTokenError si la session a été révoquée ou refreshée par quelqu'un d'autre pendant ce temps.
   */
  async rotate(session: Session): Promise<AuthTokens> {
    const now = new Date();
    const previousHash = session.refreshTokenHash;
    const secret = this.secrets.generate();
    session.rotate(this.secrets.fingerprint(secret), now, new Date(now.getTime() + this.sessionTtlMs));
    if (!(await this.sessions.saveRotation(session, previousHash))) throw new InvalidRefreshTokenError();
    return this.tokensFor(session, secret);
  }

  /** null si le jeton n'a pas la forme "<sessionId>.<secret>". */
  static parseRefreshToken(token: string): { sessionId: string; secret: string } | null {
    const dot = token.indexOf(".");
    if (dot <= 0 || dot === token.length - 1) return null;
    return { sessionId: token.slice(0, dot), secret: token.slice(dot + 1) };
  }

  private async tokensFor(session: Session, secret: string): Promise<AuthTokens> {
    return {
      accessToken: await this.accessTokens.issue({ userId: session.userId, sessionId: session.id }),
      refreshToken: `${session.id}.${secret}`,
    };
  }
}
