import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { isUniqueViolation } from "@core/database/is-unique-violation.js";
import { User } from "../domain/user.js";
import { EmailAlreadyUsedError } from "../domain/user.errors.js";
import { UserRepository } from "../domain/user.repository.js";
import { UserOrmEntity } from "./user.orm-entity.js";

/** Adapter TypeORM : traduit entre l'entité du domaine et la ligne en base. */
@Injectable()
export class TypeOrmUserRepository extends UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly orm: Repository<UserOrmEntity>,
  ) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.orm.findOneBy({ id });
    return row ? User.restore(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.orm.findOneBy({ email });
    return row ? User.restore(row) : null;
  }

  async save(user: User): Promise<void> {
    try {
      // Insert ou update selon que l'id existe déjà.
      await this.orm.save(this.orm.create(user.toPrimitives()));
    } catch (error) {
      // Deux inscriptions simultanées avec le même email passent toutes les deux assertEmailAvailable.
      if (isUniqueViolation(error)) throw new EmailAlreadyUsedError();
      throw error;
    }
  }
}
