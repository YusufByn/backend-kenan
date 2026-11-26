import { Injectable } from "@nestjs/common";
import { SessionRepository } from "../../domain/session.repository.js";

/** Déconnecte un de ses appareils (ex. un téléphone perdu). Sur la session de la requête, revient à un logout. */
@Injectable()
export class RevokeMySessionUseCase {
  constructor(private readonly sessions: SessionRepository) {}

  async execute(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessions.getOwnedBy(sessionId, userId);
    session.revoke(new Date());
    await this.sessions.save(session);
  }
}
