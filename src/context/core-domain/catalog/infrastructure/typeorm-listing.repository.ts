import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, type Repository } from "typeorm";
import { Listing } from "../domain/listing.js";
import { ListingConcurrentUpdateError } from "../domain/listing.errors.js";
import { ListingRepository, type ListingSearch, type ListingSort } from "../domain/listing.repository.js";
import { ListingOrmEntity } from "./listing.orm-entity.js";

const ORDER_BY: Record<ListingSort, [column: string, direction: "ASC" | "DESC"]> = {
  recent: ["l.publishedAt", "DESC"],
  price_asc: ["l.priceCents", "ASC"],
  price_desc: ["l.priceCents", "DESC"],
};

/** Échappe % et _ pour qu'une recherche "50%" cherche bien le texte "50%". */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, (char) => `\\${char}`);

@Injectable()
export class TypeOrmListingRepository extends ListingRepository {
  constructor(
    @InjectRepository(ListingOrmEntity)
    private readonly orm: Repository<ListingOrmEntity>,
  ) {
    super();
  }

  async findById(id: string): Promise<Listing | null> {
    const row = await this.orm.findOneBy({ id });
    return row ? Listing.restore(row) : null;
  }

  async findByIds(ids: string[]): Promise<Listing[]> {
    if (ids.length === 0) return [];
    const rows = await this.orm.findBy({ id: In(ids) });
    return rows.map((row) => Listing.restore(row));
  }

  async findBySeller(sellerId: string): Promise<Listing[]> {
    const rows = await this.orm.find({ where: { sellerId }, order: { createdAt: "DESC" } });
    return rows.map((row) => Listing.restore(row));
  }

  async searchPublished(criteria: ListingSearch): Promise<{ items: Listing[]; total: number }> {
    const query = this.orm.createQueryBuilder("l").where("l.status = :status", { status: "published" });

    if (criteria.q?.trim()) {
      const like = `%${escapeLike(criteria.q.trim().toLowerCase())}%`;
      query.andWhere(
        "(LOWER(l.title) LIKE :like ESCAPE '\\' OR LOWER(l.brand) LIKE :like ESCAPE '\\' " +
          "OR LOWER(l.model) LIKE :like ESCAPE '\\' OR LOWER(l.description) LIKE :like ESCAPE '\\')",
        { like },
      );
    }
    if (criteria.category) query.andWhere("l.category = :category", { category: criteria.category });
    if (criteria.brand) query.andWhere("LOWER(l.brand) = :brand", { brand: criteria.brand.trim().toLowerCase() });
    if (criteria.frameSize) query.andWhere("l.frameSize = :frameSize", { frameSize: criteria.frameSize });
    if (criteria.wheelSize) query.andWhere("l.wheelSize = :wheelSize", { wheelSize: criteria.wheelSize });
    if (criteria.condition) query.andWhere("l.condition = :condition", { condition: criteria.condition });
    if (criteria.minPriceCents !== undefined) query.andWhere("l.priceCents >= :min", { min: criteria.minPriceCents });
    if (criteria.maxPriceCents !== undefined) query.andWhere("l.priceCents <= :max", { max: criteria.maxPriceCents });

    const [column, direction] = ORDER_BY[criteria.sort];
    const [rows, total] = await query
      .orderBy(column, direction)
      .addOrderBy("l.id", "ASC") // ordre stable entre deux pages
      .skip((criteria.page - 1) * criteria.limit)
      .take(criteria.limit)
      .getManyAndCount();

    return { items: rows.map((row) => Listing.restore(row)), total };
  }

  async saveAll(listings: Listing[]): Promise<void> {
    await this.orm.manager.transaction(async (manager) => {
      for (const listing of listings) {
        const { id, ...columns } = listing.toPrimitives();
        const expectedStatus = listing.statusInStore;

        if (expectedStatus === null) {
          await manager.insert(ListingOrmEntity, { id, ...columns });
          continue;
        }
        // Mise à jour conditionnelle : échoue si quelqu'un a changé le statut entre-temps
        // (ex : deux acheteurs qui valident leur panier en même temps).
        const result = await manager.update(ListingOrmEntity, { id, status: expectedStatus }, columns);
        if (result.affected !== 1) throw new ListingConcurrentUpdateError();
      }
    });
    listings.forEach((listing) => listing.markStored());
  }
}
