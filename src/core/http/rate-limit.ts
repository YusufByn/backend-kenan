import { Throttle } from "@nestjs/throttler";

/**
 * Limite globale, appliquée à toutes les routes par ThrottlerGuard (app.module.ts) : par adresse IP.
 * Au-delà : 429 TOO_MANY_REQUESTS, au format d'erreur commun.
 */
export const DEFAULT_RATE_LIMIT = { ttl: 60_000, limit: 120 };

/**
 * Limite stricte pour les routes qu'on peut attaquer en force brute ou utiliser pour spammer :
 * login, inscription, mot de passe oublié, renvoi d'email de vérification.
 * 5 essais par minute et par IP.
 */
export const StrictRateLimit = () => Throttle({ default: { ttl: 60_000, limit: 5 } });
