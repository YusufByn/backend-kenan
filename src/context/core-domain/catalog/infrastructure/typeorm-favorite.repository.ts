import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import type { Repository } from "typeorm";
import { offsetOf, type PageRequest } from "@core/http/pagination.js";
import { FavoriteRepository, type Favorite } from "../domain/favorite.repository.js";
import { FavoriteOrmEntity } from "./favorite.orm-entity.js";

@Injectable()
export class TypeOrmFavoriteRepository extends FavoriteRepository {
  constructor(
    @InjectRepository(FavoriteOrmEntity)
    private readonly orm: Repository<FavoriteOrmEntity>,
  ) {
    super();
  }

  async add(favorite: Favorite): Promise<void> {
    // INSERT OR IGNORE : la clé primaire (userId, listingId) rend l'opération idempotente, même en concurrence.
    await this.orm.createQueryBuilder().insert().values(favorite).orIgnore().execute();
  }

  async remove(userId: string, listingId: string): Promise<void> {
    await this.orm.delete({ userId, listingId });
  }

  async findByUser(userId: string, page: PageRequest): Promise<{ items: Favorite[]; total: number }> {
    const [items, total] = await this.orm.findAndCount({
      where: { userId },
      order: { createdAt: "DESC", listingId: "ASC" },
      skip: offsetOf(page),
      take: page.limit,
    });
    return { items, total };
  }

  async findUserIdsByListing(listingId: string): Promise<string[]> {
    const rows = await this.orm.find({ where: { listingId }, select: { userId: true } });
    return rows.map((row) => row.userId);
  }

  countByListing(listingId: string): Promise<number> {
    return this.orm.countBy({ listingId });
  }
}
