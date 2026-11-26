import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { SecretTokens } from "../domain/secret-tokens.js";

const TOKEN_BYTES = 32;

/**
 * 32 octets aléatoires en base64url, empreinte SHA-256 en hexadécimal.
 * Pas de scrypt ici (contrairement aux mots de passe) : un jeton de 256 bits aléatoires ne se devine pas,
 * un hash rapide suffit et permet de le chercher directement en base.
 */
@Injectable()
export class CryptoSecretTokens extends SecretTokens {
  generate(): string {
    return randomBytes(TOKEN_BYTES).toString("base64url");
  }

  fingerprint(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  matches(token: string, fingerprint: string): boolean {
    const expected = Buffer.from(fingerprint, "hex");
    const actual = Buffer.from(this.fingerprint(token), "hex");
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
