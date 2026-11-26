/**
 * Une connexion ouverte sur un appareil. Créée au login (ou à l'inscription), elle porte le refresh token
 * (seulement son empreinte) et son id est mis dans chaque access token : révoquer la session coupe
 * immédiatement les access tokens déjà délivrés pour elle.
 */
export type SessionPrimitives = {
  id: string;
  userId: string;
  /** Empreinte du secret du refresh token actuel. Le secret lui-même n'est jamais stocké. */
  refreshTokenHash: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  /** Sans refresh avant cette date, la session expire. Repoussée à chaque refresh. */
  expiresAt: Date;
  /** null = session ouverte. */
  revokedAt: Date | null;
};

/** Ce que le user voit de ses sessions (GET /me/sessions). */
export type SessionView = {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: Date;
  lastUsedAt: Date;
  expiresAt: Date;
  /** La session de la requête en cours. */
  current: boolean;
};

const USER_AGENT_MAX_LENGTH = 255;

export class Session {
  private constructor(
    readonly id: string,
    readonly userId: string,
    private refreshTokenHashValue: string,
    readonly userAgent: string | null,
    readonly ip: string | null,
    readonly createdAt: Date,
    private lastUsedAt: Date,
    private expiresAt: Date,
    private revokedAt: Date | null,
  ) {}

  static open(props: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    userAgent: string | null;
    ip: string | null;
    now: Date;
    expiresAt: Date;
  }): Session {
    const userAgent = props.userAgent?.trim().slice(0, USER_AGENT_MAX_LENGTH) || null;
    return new Session(props.id, props.userId, props.refreshTokenHash, userAgent, props.ip, props.now, props.now, props.expiresAt, null);
  }

  static restore(props: SessionPrimitives): Session {
    return new Session(
      props.id,
      props.userId,
      props.refreshTokenHash,
      props.userAgent,
      props.ip,
      props.createdAt,
      props.lastUsedAt,
      props.expiresAt,
      props.revokedAt,
    );
  }

  get refreshTokenHash(): string {
    return this.refreshTokenHashValue;
  }

  isActive(now: Date): boolean {
    return this.revokedAt === null && this.expiresAt > now;
  }

  /** Refresh : l'ancien refresh token ne marche plus, la session est prolongée. */
  rotate(refreshTokenHash: string, now: Date, expiresAt: Date): void {
    this.refreshTokenHashValue = refreshTokenHash;
    this.lastUsedAt = now;
    this.expiresAt = expiresAt;
  }

  /** Idempotent : révoquer une session déjà révoquée ne change pas la date. */
  revoke(now: Date): void {
    this.revokedAt ??= now;
  }

  toView(currentSessionId: string): SessionView {
    return {
      id: this.id,
      userAgent: this.userAgent,
      ip: this.ip,
      createdAt: this.createdAt,
      lastUsedAt: this.lastUsedAt,
      expiresAt: this.expiresAt,
      current: this.id === currentSessionId,
    };
  }

  toPrimitives(): SessionPrimitives {
    return {
      id: this.id,
      userId: this.userId,
      refreshTokenHash: this.refreshTokenHashValue,
      userAgent: this.userAgent,
      ip: this.ip,
      createdAt: this.createdAt,
      lastUsedAt: this.lastUsedAt,
      expiresAt: this.expiresAt,
      revokedAt: this.revokedAt,
    };
  }
}
