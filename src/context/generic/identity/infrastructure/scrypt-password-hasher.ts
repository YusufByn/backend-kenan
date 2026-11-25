import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { Injectable } from "@nestjs/common";
import { PasswordHasher } from "../domain/password-hasher.js";

const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keyLength: number) => Promise<Buffer>;

const SALT_BYTES = 16;
const KEY_BYTES = 64;

/** scrypt est inclus dans Node : aucune dépendance. Stocké sous la forme "sel:hash" en hexadécimal. */
@Injectable()
export class ScryptPasswordHasher extends PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(SALT_BYTES);
    const key = await scryptAsync(password, salt, KEY_BYTES);
    return `${salt.toString("hex")}:${key.toString("hex")}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const [saltHex, keyHex] = hash.split(":");
    if (!saltHex || !keyHex) return false;
    const expected = Buffer.from(keyHex, "hex");
    const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), expected.length);
    // Comparaison en temps constant : le temps de réponse ne révèle rien du hash.
    return timingSafeEqual(expected, actual);
  }
}
