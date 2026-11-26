/**
 * Jeton à usage unique envoyé par email : mot de passe oublié, vérification de l'adresse.
 * Le jeton en clair n'existe que dans l'email ; la base n'en garde que l'empreinte (SecretTokens).
 */
export const TOKEN_PURPOSES = ["password_reset", "email_verification"] as const;
export type TokenPurpose = (typeof TOKEN_PURPOSES)[number];

/** Un lien de reset est sensible (il donne le compte) : 1 h. Une vérification d'email peut attendre : 48 h. */
export const TOKEN_TTL_MS: Record<TokenPurpose, number> = {
  password_reset: 60 * 60 * 1000,
  email_verification: 48 * 60 * 60 * 1000,
};

export type OneTimeTokenPrimitives = {
  id: string;
  userId: string;
  purpose: TokenPurpose;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  /** Utilisé, ou remplacé par un envoi plus récent. null = encore utilisable. */
  usedAt: Date | null;
};

export class OneTimeToken {
  private constructor(private readonly props: OneTimeTokenPrimitives) {}

  static issue(props: { id: string; userId: string; purpose: TokenPurpose; tokenHash: string; now: Date }): OneTimeToken {
    return new OneTimeToken({
      ...props,
      createdAt: props.now,
      expiresAt: new Date(props.now.getTime() + TOKEN_TTL_MS[props.purpose]),
      usedAt: null,
    });
  }

  static restore(props: OneTimeTokenPrimitives): OneTimeToken {
    return new OneTimeToken({ ...props });
  }

  get userId(): string {
    return this.props.userId;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get id(): string {
    return this.props.id;
  }

  /** Ni utilisé, ni remplacé, ni expiré. */
  isUsable(now: Date): boolean {
    return this.props.usedAt === null && this.props.expiresAt > now;
  }

  toPrimitives(): OneTimeTokenPrimitives {
    return { ...this.props };
  }
}
