import { Injectable } from "@nestjs/common";
import { SessionRepository } from "../../domain/session.repository.js";

/** Ferme la session de la requête : son access token et son refresh token ne marchent plus. Les autres appareils restent connectés. */
@Injectable()
export class LogoutUseCase {
  constructor(private readonly sessions: SessionRepository) {}

  async execute(userId: string, sessionId: string): Promise<void> {
    const session = await this.sessions.getOwnedBy(sessionId, userId);
    session.revoke(new Date());
    await this.sessions.save(session);
  }
}
