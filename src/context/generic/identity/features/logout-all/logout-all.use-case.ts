import { Injectable } from "@nestjs/common";
import { SessionRepository } from "../../domain/session.repository.js";

/** Ferme toutes les sessions du user, celle de la requête comprise : déconnecté de partout. */
@Injectable()
export class LogoutAllUseCase {
  constructor(private readonly sessions: SessionRepository) {}

  async execute(userId: string): Promise<void> {
    await this.sessions.revokeAllForUser(userId, new Date());
  }
}
