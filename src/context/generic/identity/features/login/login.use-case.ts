import { Injectable } from "@nestjs/common";
import { PasswordHasher } from "../../domain/password-hasher.js";
import { SessionIssuer, type AuthTokens, type ClientInfo } from "../../domain/session-issuer.js";
import { User } from "../../domain/user.js";
import { InvalidCredentialsError } from "../../domain/user.errors.js";
import { UserRepository } from "../../domain/user.repository.js";

@Injectable()
export class LoginUseCase {
  /**
   * Hash d'un mot de passe que personne ne connaît, vérifié quand l'email est inconnu : la réponse prend
   * alors le même temps (un hachage scrypt) que pour un email existant. Sinon, le temps de réponse
   * révélerait quels emails ont un compte.
   */
  private readonly decoyHash: Promise<string>;

  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly issuer: SessionIssuer,
  ) {
    this.decoyHash = hasher.hash(crypto.randomUUID());
  }

  /** Ouvre une nouvelle session (une par appareil) : les autres restent connectées. */
  async execute(input: { email: string; password: string }, client: ClientInfo): Promise<AuthTokens> {
    const user = await this.users.findByEmail(User.normalizeEmail(input.email));
    const passwordMatches = await this.hasher.verify(input.password, user?.passwordHash ?? (await this.decoyHash));
    if (!user || !passwordMatches) throw new InvalidCredentialsError();
    // Après la vérification du mot de passe : on ne révèle la suspension qu'au titulaire du compte.
    user.assertActive();

    return this.issuer.open(user.id, client);
  }
}
