import { Session } from "./session.js";
import { SessionNotFoundError } from "./session.errors.js";

/** Port : stocker / retrouver les sessions. */
export abstract class SessionRepository {
  abstract findById(id: string): Promise<Session | null>;
  /** Sessions ouvertes et non expirées du user, plus récemment utilisées d'abord. */
  abstract findActiveByUserId(userId: string, now: Date): Promise<Session[]>;
  abstract save(session: Session): Promise<void>;
  /**
   * Enregistre un refresh seulement si, en base, la session est toujours ouverte et porte encore
   * `previousRefreshTokenHash`. Renvoie false sinon (révoquée entre-temps, ou deux refresh simultanés
   * avec le même token) : rien n'est écrit, et un logout concurrent n'est jamais annulé.
   */
  abstract saveRotation(session: Session, previousRefreshTokenHash: string): Promise<boolean>;
  /** Révoque d'un coup toutes les sessions ouvertes du user, sauf `exceptSessionId` (celle qu'on garde). */
  abstract revokeAllForUser(userId: string, now: Date, exceptSessionId?: string): Promise<void>;
  /** Ménage : supprime les sessions expirées ou révoquées avant `before`. Renvoie le nombre de lignes supprimées. */
  abstract deleteClosedBefore(before: Date): Promise<number>;

  /** Une session d'un autre user est traitée comme introuvable : on ne révèle pas qu'elle existe. */
  async getOwnedBy(sessionId: string, userId: string): Promise<Session> {
    const session = await this.findById(sessionId);
    if (!session || session.userId !== userId) throw new SessionNotFoundError(sessionId);
    return session;
  }
}
