import { Injectable } from "@nestjs/common";
import { SecretTokens } from "../../domain/secret-tokens.js";
import { SessionIssuer, type AuthTokens } from "../../domain/session-issuer.js";
import { InvalidRefreshTokenError } from "../../domain/session.errors.js";
import { SessionRepository } from "../../domain/session.repository.js";
import { UserRepository } from "../../domain/user.repository.js";

/**
 * Échange un refresh token contre un nouvel access token ET un nouveau refresh token (rotation) :
 * chaque refresh token ne sert qu'une fois.
 */
@Injectable()
export class RefreshSessionUseCase {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly users: UserRepository,
    private readonly secrets: SecretTokens,
    private readonly issuer: SessionIssuer,
  ) {}

  async execute(refreshToken: string): Promise<AuthTokens> {
    const parsed = SessionIssuer.parseRefreshToken(refreshToken);
    if (!parsed) throw new InvalidRefreshTokenError();

    const now = new Date();
    const session = await this.sessions.findById(parsed.sessionId);
    if (!session || !session.isActive(now)) throw new InvalidRefreshTokenError();

    if (!this.secrets.matches(parsed.secret, session.refreshTokenHash)) {
      // Bonne session, mauvais secret : un ancien refresh token est rejoué. Soit il a été volé, soit le voleur
      // a déjà refreshé avant le titulaire. Impossible de savoir qui est qui : on ferme la session, les deux
      // devront se reconnecter (et seul le titulaire connaît le mot de passe).
      session.revoke(now);
      await this.sessions.save(session);
      throw new InvalidRefreshTokenError();
    }

    const user = await this.users.findById(session.userId);
    if (!user) throw new InvalidRefreshTokenError();
    user.assertActive();

    return this.issuer.rotate(session);
  }
}
