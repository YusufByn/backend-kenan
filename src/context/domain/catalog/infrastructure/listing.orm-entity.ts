import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import type { Category, Condition, FrameSize, ListingStatus, WheelSize } from "../domain/listing.entity.js";

/** Table "listings". Les enums sont stockés en texte : la validation est faite par le domaine. */
@Entity("listings")
export class ListingOrmEntity {
  @PrimaryColumn("varchar")
  id!: string;

  @Index()
  @Column("varchar")
  sellerId!: string;

  @Column("varchar")
  title!: string;

  @Column("text")
  description!: string;

  @Column("varchar")
  brand!: string;

  @Column("varchar")
  model!: string;

  @Column("varchar")
  category!: Category;

  @Column("varchar")
  frameSize!: FrameSize;

  @Column("varchar")
  wheelSize!: WheelSize;

  @Column("varchar")
  condition!: Condition;

  @Column("int")
  year!: number;

  @Column("int")
  priceCents!: number;

  @Column("simple-json")
  photoUrls!: string[];

  @Index()
  @Column("varchar")
  status!: ListingStatus;

  @Column("datetime")
  createdAt!: Date;

  @Column("datetime", { nullable: true })
  publishedAt!: Date | null;
}
