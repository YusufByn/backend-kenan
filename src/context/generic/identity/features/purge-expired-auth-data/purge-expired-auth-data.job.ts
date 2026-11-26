import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { OneTimeTokenRepository } from "../../domain/one-time-token.repository.js";
import { SessionRepository } from "../../domain/session.repository.js";

/** On garde une semaine d'historique (utile pour comprendre un incident), puis on supprime. */
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Déclenché par l'horloge, pas par une route : chaque nuit, supprime les sessions fermées
 * et les jetons à usage unique expirés depuis plus d'une semaine. Sans ça, les tables grossissent à chaque login.
 */
@Injectable()
export class PurgeExpiredAuthDataJob {
  private readonly logger = new Logger("PurgeExpiredAuthData");

  constructor(
    private readonly sessions: SessionRepository,
    private readonly tokens: OneTimeTokenRepository,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async run(): Promise<void> {
    const before = new Date(Date.now() - RETENTION_MS);
    const sessions = await this.sessions.deleteClosedBefore(before);
    const tokens = await this.tokens.deleteExpiredBefore(before);
    if (sessions + tokens > 0) this.logger.log(`${sessions} session(s) et ${tokens} jeton(s) supprimés`);
  }
}
