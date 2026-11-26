import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { IsNull, LessThan, type Repository } from "typeorm";
import { OneTimeToken, type TokenPurpose } from "../domain/one-time-token.js";
import { OneTimeTokenRepository } from "../domain/one-time-token.repository.js";
import { OneTimeTokenOrmEntity } from "./one-time-token.orm-entity.js";

@Injectable()
export class TypeOrmOneTimeTokenRepository extends OneTimeTokenRepository {
  constructor(
    @InjectRepository(OneTimeTokenOrmEntity)
    private readonly orm: Repository<OneTimeTokenOrmEntity>,
  ) {
    super();
  }

  async findByHash(purpose: TokenPurpose, tokenHash: string): Promise<OneTimeToken | null> {
    const row = await this.orm.findOneBy({ purpose, tokenHash });
    return row ? OneTimeToken.restore(row) : null;
  }

  async save(token: OneTimeToken): Promise<void> {
    await this.orm.save(this.orm.create(token.toPrimitives()));
  }

  async markUsed(id: string, now: Date): Promise<boolean> {
    const result = await this.orm.update({ id, usedAt: IsNull() }, { usedAt: now });
    return result.affected === 1;
  }

  async invalidateAllForUser(userId: string, purpose: TokenPurpose, now: Date): Promise<void> {
    await this.orm.update({ userId, purpose, usedAt: IsNull() }, { usedAt: now });
  }

  async deleteExpiredBefore(before: Date): Promise<number> {
    const result = await this.orm.delete({ expiresAt: LessThan(before) });
    return result.affected ?? 0;
  }
}
