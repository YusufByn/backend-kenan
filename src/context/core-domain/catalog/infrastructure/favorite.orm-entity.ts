import { Column, Entity, Index, PrimaryColumn } from "typeorm";

/** Table "favorites" : clé primaire (userId, listingId), donc un seul favori par couple. */
@Entity("favorites")
export class FavoriteOrmEntity {
  @PrimaryColumn("varchar")
  userId!: string;

  @Index()
  @PrimaryColumn("varchar")
  listingId!: string;

  @Column("datetime")
  createdAt!: Date;
}
