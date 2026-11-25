import { existsSync } from "node:fs";
import type { JwtSignOptions } from "@nestjs/jwt";

// Charge le fichier .env à la racine avec la fonction native de Node (pas besoin de dotenv).
// Tout module qui importe `env` est évalué après ce fichier, donc les valeurs sont déjà chargées.
// Une variable déjà définie dans le shell n'est pas écrasée par le .env.
if (existsSync(".env")) process.loadEnvFile(".env");

export const env = {
  port: Number(process.env.PORT ?? 3000),
  databasePath: process.env.DATABASE_PATH ?? "db.sqlite",
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-a-changer",
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? "1d") as JwtSignOptions["expiresIn"],
};
