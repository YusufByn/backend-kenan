import { existsSync } from "node:fs";
import type { JwtSignOptions } from "@nestjs/jwt";

// Charge le fichier .env à la racine avec la fonction native de Node (pas besoin de dotenv).
// Tout module qui importe `env` est évalué après ce fichier, donc les valeurs sont déjà chargées.
// Une variable déjà définie dans le shell n'est pas écrasée par le .env.
if (existsSync(".env")) process.loadEnvFile(".env");

const DEV_JWT_SECRET = "dev-secret-a-changer";
const isProduction = process.env.NODE_ENV === "production";

/** "a, b,,c" → ["a", "b", "c"] */
const list = (value: string | undefined): string[] =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const port = Number(process.env.PORT ?? 3000);

export const env = {
  isProduction,
  port,
  /** URL publique de l'API : sert à construire les URLs des photos uploadées. */
  publicUrl: (process.env.PUBLIC_URL ?? `http://localhost:${port}`).replace(/\/$/, ""),
  databasePath: process.env.DATABASE_PATH ?? "db.sqlite",
  /**
   * true seulement derrière un reverse proxy (Render, Nginx...) : l'IP du client est alors lue dans X-Forwarded-For.
   * Sans proxy, laisser false : sinon n'importe qui forge cet en-tête pour contourner la limite de requêtes.
   */
  trustProxy: process.env.TRUST_PROXY === "true",
  /** RATE_LIMIT=off désactive la limite de requêtes (tests automatisés, seeder). Toujours active en production. */
  rateLimitEnabled: isProduction || process.env.RATE_LIMIT !== "off",
  /** Origines autorisées à appeler l'API depuis un navigateur. Vide = toutes (pratique en dev). */
  corsOrigins: list(process.env.CORS_ORIGINS),

  jwtSecret: process.env.JWT_SECRET || DEV_JWT_SECRET,
  /** Durée de vie d'un access token. Court : le refresh token prend le relais. */
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN ?? "15m") as JwtSignOptions["expiresIn"],
  /** Une session (et son refresh token) expire après ce nombre de jours sans refresh. */
  sessionTtlDays: Number(process.env.SESSION_TTL_DAYS ?? 30),
  /** Comptes toujours admin (une fois leur email vérifié). "a@x.com, b@y.com" → ["a@x.com", "b@y.com"]. */
  adminEmails: list(process.env.ADMIN_EMAILS),

  /** URL du front (sans slash final) : les liens des emails pointent vers ses pages. */
  frontendUrl: (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, ""),
  /** Envoi d'emails : sans SMTP_HOST, les emails sont affichés dans le terminal (ConsoleMailer). */
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 587),
    user: process.env.SMTP_USER ?? "",
    password: process.env.SMTP_PASSWORD ?? "",
    from: process.env.MAIL_FROM ?? "Vélo Marketplace <no-reply@velo-marketplace.local>",
  },

  /** Dossier où sont stockées les photos uploadées, servi sur /uploads. */
  uploadsDir: process.env.UPLOADS_DIR ?? "uploads",
};

// En production, un secret par défaut connu de tous permettrait de forger des tokens : on refuse de démarrer.
if (isProduction && env.jwtSecret === DEV_JWT_SECRET) {
  throw new Error("JWT_SECRET est obligatoire en production (openssl rand -hex 32)");
}
