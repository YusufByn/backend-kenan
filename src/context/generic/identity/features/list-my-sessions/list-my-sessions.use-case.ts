import { Injectable } from "@nestjs/common";
import type { SessionView } from "../../domain/session.js";
import { SessionRepository } from "../../domain/session.repository.js";

/** Les appareils actuellement connectés au compte, la session de la requête marquée `current`. */
@Injectable()
export class ListMySessionsUseCase {
  constructor(private readonly sessions: SessionRepository) {}

  async execute(userId: string, currentSessionId: string): Promise<SessionView[]> {
    const sessions = await this.sessions.findActiveByUserId(userId, new Date());
    return sessions.map((session) => session.toView(currentSessionId));
  }
}
