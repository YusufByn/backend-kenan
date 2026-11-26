import { Column, Entity, Index, PrimaryColumn } from "typeorm";

@Entity("reviews")
export class ReviewOrmEntity {
  @PrimaryColumn("varchar")
  id!: string;

  /** unique : filet de sécurité en base, en plus de la règle du domaine (un avis par commande). */
  @Column("varchar", { unique: true })
  orderId!: string;

  @Index()
  @Column("varchar")
  sellerId!: string;

  @Column("varchar")
  buyerId!: string;

  @Column("int")
  rating!: number;

  @Column("text")
  comment!: string;

  @Column("datetime")
  createdAt!: Date;

  @Column("text", { nullable: true })
  sellerReply!: string | null;

  @Column("datetime", { nullable: true })
  repliedAt!: Date | null;

  @Column("datetime", { nullable: true })
  removedAt!: Date | null;
}
