import { QueryFailedError } from "typeorm";

/**
 * Vrai si l'écriture a échoué sur un index UNIQUE (code d'erreur SQLite).
 * Sert aux repositories à traduire ce cas en erreur métier : la vérification faite avant
 * l'écriture ne suffit pas quand deux requêtes arrivent en même temps, c'est l'index qui tranche.
 */
export function isUniqueViolation(error: unknown): boolean {
  if (!(error instanceof QueryFailedError)) return false;
  const driverError = error.driverError as { code?: string } | undefined;
  return driverError?.code === "SQLITE_CONSTRAINT_UNIQUE";
}
