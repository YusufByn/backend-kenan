import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { AccessTokens, type AccessTokenClaims } from "../domain/access-tokens.js";

/** Adapter JWT. Le secret et la durée de vie sont configurés dans identity.module.ts. Payload : { sub: userId, sid: sessionId }. */
@Injectable()
export class JwtAccessTokens extends AccessTokens {
  constructor(private readonly jwt: JwtService) {
    super();
  }

  issue({ userId, sessionId }: AccessTokenClaims): Promise<string> {
    return this.jwt.signAsync({ sub: userId, sid: sessionId });
  }

  async verify(token: string): Promise<AccessTokenClaims | null> {
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: unknown; sid?: unknown }>(token);
      if (typeof payload.sub !== "string" || typeof payload.sid !== "string") return null;
      return { userId: payload.sub, sessionId: payload.sid };
    } catch {
      // Signature invalide, jeton expiré ou mal formé : même réponse.
      return null;
    }
  }
}
