import { add, hasAll, isStrictSubset, remove } from "@core/bitmask/bitmask.js";
import { ALL_PERMISSIONS, PERMISSIONS, toNames, type PermissionName } from "./permissions.js";
import { roleOf, type Role } from "./role.js";
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
  /** Masque de permissions (voir permissions.ts). */
  permissions: bigint;
  /** null = compte actif. */
  suspendedAt: Date | null;
  createdAt: Date;
};

/** Ce qu'un user voit de son propre compte. Jamais le hash du mot de passe. */
export type UserProfile = {
  id: string;
  name: string;
  email: string;
  /** Le rôle si le masque correspond exactement à un preset, sinon null (permissions personnalisées). */
  role: Role | null;
  permissions: PermissionName[];
  createdAt: Date;
};

/**
 * Ce que la modération voit d'un compte : le profil + le masque brut + son état.
 * Le masque est une chaîne : JSON ne sait pas sérialiser un BigInt.
 */
export type UserAdminView = UserProfile & { permissionsMask: string; suspendedAt: Date | null };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

export class User {
  private constructor(
    readonly id: string,
    private name: string,
    private email: string,
    readonly passwordHash: string,
    private mask: bigint,
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
      props.permissions,
      null,
      props.createdAt,
    );
  }

  /** Reconstruit un user déjà validé, lu depuis le stockage. */
  static restore(props: UserPrimitives): User {
    return new User(props.id, props.name, props.email, props.passwordHash, props.permissions, props.suspendedAt, props.createdAt);
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

  get permissions(): bigint {
    return this.mask;
  }

  get isSuspended(): boolean {
    return this.suspendedAt !== null;
  }

  /** A toutes les permissions de `flags`. */
  can(flags: bigint): boolean {
    return hasAll(this.mask, flags);
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

  /**
   * Remplace ou ajuste le masque. Règles :
   * - il faut USERS_MANAGE_PERMISSIONS, et jamais sur son propre compte ;
   * - on ne touche qu'aux bits qu'on possède soi-même : un moderator à qui on aurait donné
   *   USERS_MANAGE_PERMISSIONS ne peut pas se fabriquer un admin.
   */
  changePermissions(actor: User, change: { set: bigint } | { grant: bigint; revoke: bigint }): void {
    if (!actor.can(PERMISSIONS.USERS_MANAGE_PERMISSIONS)) {
      throw new UserActionForbiddenError("Il faut la permission USERS_MANAGE_PERMISSIONS");
    }
    if (actor.id === this.id) throw new UserActionForbiddenError("Tu ne peux pas changer tes propres permissions");

    const next = "set" in change ? change.set : remove(add(this.mask, change.grant), change.revoke);
    const changedBits = this.mask ^ next; // XOR : les bits qui passent de 0 à 1 ou de 1 à 0
    if (!actor.can(changedBits)) {
      const missing = toNames(remove(changedBits, actor.mask));
      throw new UserActionForbiddenError(`Tu ne peux pas donner ou retirer une permission que tu n'as pas : ${missing.join(", ")}`);
    }
    this.mask = next;
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
   * Compte listé dans ADMIN_EMAILS : toutes les permissions et actif, quoi qu'il arrive
   * (y compris les permissions ajoutées au catalogue depuis le dernier démarrage).
   * Renvoie false si rien n'a changé (évite une écriture inutile au démarrage).
   */
  grantBootstrapAdmin(): boolean {
    if (this.mask === ALL_PERMISSIONS && !this.isSuspended) return false;
    this.mask = ALL_PERMISSIONS;
    this.suspendedAt = null;
    return true;
  }

  toProfile(): UserProfile {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      role: roleOf(this.mask),
      permissions: toNames(this.mask),
      createdAt: this.createdAt,
    };
  }

  toAdminView(): UserAdminView {
    return { ...this.toProfile(), permissionsMask: this.mask.toString(), suspendedAt: this.suspendedAt };
  }

  toPrimitives(): UserPrimitives {
    return {
      id: this.id,
      name: this.name,
      email: this.email,
      passwordHash: this.passwordHash,
      permissions: this.mask,
      suspendedAt: this.suspendedAt,
      createdAt: this.createdAt,
    };
  }

  /**
   * On ne modère que quelqu'un qui a strictement moins de droits que soi : toutes ses permissions
   * sont aussi les nôtres, et on en a au moins une de plus. Un moderator ne suspend donc ni un
   * autre moderator (masques égaux) ni un admin ; un admin suspend un moderator.
   */
  private assertModeratableBy(actor: User): void {
    if (!actor.can(PERMISSIONS.USERS_SUSPEND)) throw new UserActionForbiddenError("Il faut la permission USERS_SUSPEND");
    if (actor.id === this.id) throw new UserActionForbiddenError("Tu ne peux pas modérer ton propre compte");
    if (!isStrictSubset(this.mask, actor.mask)) {
      throw new UserActionForbiddenError("Tu ne peux modérer que des comptes qui ont moins de permissions que toi");
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
}
