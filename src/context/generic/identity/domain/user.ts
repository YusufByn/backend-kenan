import { hasAtLeastRole, isRole, outranks, type Role } from "./role.js";
import {
  AccountSuspendedError,
  InvalidUserError,
  UserActionForbiddenError,
  UserAlreadySuspendedError,
  UserNotSuspendedError,
} from "./user.errors.js";

export type UserPrimitives = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  /** null = compte actif. */
  suspendedAt: Date | null;
  createdAt: Date;
};

/** Ce qu'un user voit de son propre compte. Jamais le hash du mot de passe. */
export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: Date;
};

/** Ce que la modération voit d'un compte : le profil + son état. */
export type UserAdminView = UserProfile & { suspendedAt: Date | null };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

export class User {
  private constructor(
    readonly id: string,
    private name: string,
    private email: string,
    readonly passwordHash: string,
    private currentRole: Role,
    private suspendedAt: Date | null,
    readonly createdAt: Date,
  ) {}

  /** Inscription d'un nouveau user : toutes les règles métier sont appliquées. Un compte neuf est toujours actif. */
  static register(props: Omit<UserPrimitives, "suspendedAt">): User {
    return new User(
      props.id,
      User.checkName(props.name),
      User.checkEmail(props.email),
      props.passwordHash,
      User.checkRole(props.role),
      null,
      props.createdAt,
    );
  }

  /** Reconstruit un user déjà validé, lu depuis le stockage. */
  static restore(props: UserPrimitives): User {
    return new User(props.id, props.name, props.email, props.passwordHash, props.role, props.suspendedAt, props.createdAt);
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

  get role(): Role {
    return this.currentRole;
  }

  get isSuspended(): boolean {
    return this.suspendedAt !== null;
  }

  /** Appelé à la connexion et à chaque requête authentifiée. */
  assertActive(): void {
    if (this.isSuspended) throw new AccountSuspendedError();
  }

  update(changes: { name?: string; email?: string }): void {
    // On valide tout avant de modifier : jamais d'état à moitié mis à jour.
    const name = changes.name !== undefined ? User.checkName(changes.name) : this.name;
    const email = changes.email !== undefined ? User.checkEmail(changes.email) : this.email;
    this.name = name;
    this.email = email;
  }

  /** Seul un admin change les rôles, et jamais le sien (il ne peut pas se retirer ses propres droits par erreur). */
  changeRole(actor: User, role: Role): void {
    if (!hasAtLeastRole(actor.role, "admin")) {
      throw new UserActionForbiddenError("Seul un admin peut changer le rôle d'un compte");
    }
    if (actor.id === this.id) throw new UserActionForbiddenError("Tu ne peux pas changer ton propre rôle");
    this.currentRole = User.checkRole(role);
  }

  suspend(actor: User, now: Date): void {
    this.assertModeratableBy(actor);
    if (this.isSuspended) throw new UserAlreadySuspendedError();
    this.suspendedAt = now;
  }

  reactivate(actor: User): void {
    this.assertModeratableBy(actor);
    if (!this.isSuspended) throw new UserNotSuspendedError();
    this.suspendedAt = null;
  }

  /**
   * Compte listé dans ADMIN_EMAILS : admin et actif, quoi qu'il arrive.
   * Renvoie false si rien n'a changé (évite une écriture inutile au démarrage).
   */
  grantBootstrapAdmin(): boolean {
    if (this.currentRole === "admin" && !this.isSuspended) return false;
    this.currentRole = "admin";
    this.suspendedAt = null;
    return true;
  }

  toProfile(): UserProfile {
    return { id: this.id, name: this.name, email: this.email, role: this.currentRole, createdAt: this.createdAt };
  }

  toAdminView(): UserAdminView {
    return { ...this.toProfile(), suspendedAt: this.suspendedAt };
  }

  toPrimitives(): UserPrimitives {
    return { ...this.toAdminView(), passwordHash: this.passwordHash };
  }

  /** On ne modère que plus bas que soi : un moderator suspend des users, un admin suspend aussi des moderators. */
  private assertModeratableBy(actor: User): void {
    if (actor.id === this.id) throw new UserActionForbiddenError("Tu ne peux pas modérer ton propre compte");
    if (!outranks(actor.role, this.currentRole)) {
      throw new UserActionForbiddenError("Tu ne peux modérer que des comptes de rôle inférieur au tien");
    }
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

  private static checkRole(role: string): Role {
    if (!isRole(role)) throw new InvalidUserError("Rôle inconnu", "role");
    return role;
  }
}
