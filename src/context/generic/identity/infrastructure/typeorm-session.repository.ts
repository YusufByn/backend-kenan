import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, LessThan, Not, type Repository } from "typeorm";
import { Session } from "../domain/session.js";
import { SessionRepository } from "../domain/session.repository.js";
import { SessionOrmEntity } from "./session.orm-entity.js";

@Injectable()
export class TypeOrmSessionRepository extends SessionRepository {
  constructor(
    @InjectRepository(SessionOrmEntity)
    private readonly orm: Repository<SessionOrmEntity>,
  ) {
    super();
  }

  async findById(id: string): Promise<Session | null> {
    const row = await this.orm.findOneBy({ id });
    return row ? Session.restore(row) : null;
  }

  async findActiveByUserId(userId: string, now: Date): Promise<Session[]> {
    // L'expiration est filtrée en JS : une poignée de sessions par user, et pas de comparaison de dates à faire en SQLite.
    const rows = await this.orm.find({ where: { userId, revokedAt: IsNull() }, order: { lastUsedAt: "DESC" } });
    return rows.map((row) => Session.restore(row)).filter((session) => session.isActive(now));
  }

  async save(session: Session): Promise<void> {
    await this.orm.save(this.orm.create(session.toPrimitives()));
  }

  async saveRotation(session: Session, previousRefreshTokenHash: string): Promise<boolean> {
    const { refreshTokenHash, lastUsedAt, expiresAt } = session.toPrimitives();
    const result = await this.orm.update(
      { id: session.id, refreshTokenHash: previousRefreshTokenHash, revokedAt: IsNull() },
      { refreshTokenHash, lastUsedAt, expiresAt },
    );
    return result.affected === 1;
  }

  async revokeAllForUser(userId: string, now: Date, exceptSessionId?: string): Promise<void> {
    await this.orm.update(
      { userId, revokedAt: IsNull(), ...(exceptSessionId ? { id: Not(exceptSessionId) } : {}) },
      { revokedAt: now },
    );
  }

  async deleteClosedBefore(before: Date): Promise<number> {
    const expired = await this.orm.delete({ expiresAt: LessThan(before) });
    const revoked = await this.orm.delete({ revokedAt: LessThan(before) });
    return (expired.affected ?? 0) + (revoked.affected ?? 0);
  }
}
