import { InvalidUserError } from "./user.errors.js";

export type UserPrimitives = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
};

/** Ce qu'un user voit de son propre compte. Jamais le hash du mot de passe. */
export type UserProfile = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

export class User {
  private constructor(
    readonly id: string,
    private name: string,
    private email: string,
    readonly passwordHash: string,
    readonly createdAt: Date,
  ) {}

  /** Inscription d'un nouveau user : toutes les règles métier sont appliquées. */
  static register(props: UserPrimitives): User {
    return new User(
      props.id,
      User.checkName(props.name),
      User.checkEmail(props.email),
      props.passwordHash,
      props.createdAt,
    );
  }

  /** Reconstruit un user déjà validé, lu depuis le stockage. */
  static restore(props: UserPrimitives): User {
    return new User(props.id, props.name, props.email, props.passwordHash, props.createdAt);
  }

  /** Vérifié sur le mot de passe en clair, avant hachage (le domaine ne voit jamais que le hash ensuite). */
  static assertValidPassword(password: string): void {
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new InvalidUserError(`Le mot de passe doit faire au moins ${PASSWORD_MIN_LENGTH} caractères`, "password");
    }
  }

  /** Forme sous laquelle les emails sont stockés : sert aussi aux recherches par email. */
  static normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  get emailAddress(): string {
    return this.email;
  }

  update(changes: { name?: string; email?: string }): void {
    // On valide tout avant de modifier : jamais d'état à moitié mis à jour.
    const name = changes.name !== undefined ? User.checkName(changes.name) : this.name;
    const email = changes.email !== undefined ? User.checkEmail(changes.email) : this.email;
    this.name = name;
    this.email = email;
  }

  toProfile(): UserProfile {
    return { id: this.id, name: this.name, email: this.email, createdAt: this.createdAt };
  }

  toPrimitives(): UserPrimitives {
    return { ...this.toProfile(), passwordHash: this.passwordHash };
  }

  private static checkName(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) throw new InvalidUserError("Le nom est requis", "name");
    return trimmed;
  }

  private static checkEmail(email: string): string {
    const normalized = User.normalizeEmail(email);
    if (!EMAIL_PATTERN.test(normalized)) throw new InvalidUserError("Email invalide", "email");
    return normalized;
  }
}
