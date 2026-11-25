import { Injectable } from "@nestjs/common";
import { AccessTokens } from "../../domain/access-tokens.js";
import { PasswordHasher } from "../../domain/password-hasher.js";
import { User } from "../../domain/user.js";
import { InvalidCredentialsError } from "../../domain/user.errors.js";
import { UserRepository } from "../../domain/user.repository.js";

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: AccessTokens,
  ) {}

  async execute(input: { email: string; password: string }): Promise<{ accessToken: string }> {
    const user = await this.users.findByEmail(User.normalizeEmail(input.email));
    const passwordMatches = user ? await this.hasher.verify(input.password, user.passwordHash) : false;
    if (!user || !passwordMatches) throw new InvalidCredentialsError();
    // Après la vérification du mot de passe : on ne révèle la suspension qu'au titulaire du compte.
    user.assertActive();

    return { accessToken: await this.tokens.issue(user.id) };
  }
}
