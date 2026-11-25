import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AccessTokens } from "../domain/access-tokens.js";

/** Adapter JWT. Le secret et la durée de vie sont configurés dans identity.module.ts. */
@Injectable()
export class JwtAccessTokens extends AccessTokens {
  constructor(private readonly jwt: JwtService) {
    super();
  }

  issue(userId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId });
  }

  async verify(token: string): Promise<string | null> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: unknown }>(token);
      return typeof payload.sub === "string" ? payload.sub : null;
    } catch {
      // Signature invalide, jeton expiré ou mal formé : même réponse.
      return null;
    }
  }
}
