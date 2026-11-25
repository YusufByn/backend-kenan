import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, type Repository } from "typeorm";
import { escapeLike } from "@core/database/escape-like.js";
import { isUniqueViolation } from "@core/database/is-unique-violation.js";
import { User } from "../domain/user.js";
import { EmailAlreadyUsedError } from "../domain/user.errors.js";
import { UserRepository, type UserSearch } from "../domain/user.repository.js";
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

  async findByEmails(emails: string[]): Promise<User[]> {
    if (emails.length === 0) return [];
    const rows = await this.orm.findBy({ email: In(emails) });
    return rows.map((row) => User.restore(row));
  }

  async search(criteria: UserSearch): Promise<{ items: User[]; total: number }> {
    const query = this.orm.createQueryBuilder("u");

    if (criteria.q?.trim()) {
      const like = `%${escapeLike(criteria.q.trim().toLowerCase())}%`;
      query.andWhere("(LOWER(u.name) LIKE :like ESCAPE '\\' OR u.email LIKE :like ESCAPE '\\')", { like });
    }
    // Test de bits fait par SQLite : (masque & flags) = flags, comme hasAll().
    // Passé en BigInt, pas en texte : pour SQLite, l'entier 4 n'est jamais égal au texte '4'.
    if (criteria.permissions) {
      query.andWhere("(u.permissions & :flags) = :flags", { flags: criteria.permissions });
    }
    if (criteria.status === "active") query.andWhere("u.suspendedAt IS NULL");
    if (criteria.status === "suspended") query.andWhere("u.suspendedAt IS NOT NULL");

    const [rows, total] = await query
      .orderBy("u.createdAt", "DESC")
      .addOrderBy("u.id", "ASC") // ordre stable entre deux pages
      .skip((criteria.page - 1) * criteria.limit)
      .take(criteria.limit)
      .getManyAndCount();

    return { items: rows.map((row) => User.restore(row)), total };
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
