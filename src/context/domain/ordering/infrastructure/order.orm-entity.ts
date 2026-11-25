import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import type { OrderStatus, ShippingAddress } from "../domain/order.entity.js";

// Les deux tables sont dans le même fichier et sans relation TypeORM :
// le repository charge les lignes lui-même, ce qui évite les imports circulaires entre entités en ESM.

@Entity("orders")
export class OrderOrmEntity {
  @PrimaryColumn("varchar")
  id!: string;

  @Index()
  @Column("varchar")
  buyerId!: string;

  @Index()
  @Column("varchar")
  sellerId!: string;

  @Column("varchar")
  status!: OrderStatus;

  /** Redondant avec la somme des lignes, gardé pour lire un total sans charger les lignes. */
  @Column("int")
  totalCents!: number;

  @Column("simple-json")
  shippingAddress!: ShippingAddress;

  @Column("varchar", { nullable: true })
  trackingNumber!: string | null;

  @Column("datetime")
  createdAt!: Date;

  @Column("datetime", { nullable: true })
  paidAt!: Date | null;

  @Column("datetime", { nullable: true })
  shippedAt!: Date | null;

  @Column("datetime", { nullable: true })
  deliveredAt!: Date | null;

  @Column("datetime", { nullable: true })
  cancelledAt!: Date | null;
}

@Entity("order_lines")
export class OrderLineOrmEntity {
  @PrimaryColumn("varchar")
  orderId!: string;

  @PrimaryColumn("varchar")
  listingId!: string;

  @Column("varchar")
  title!: string;

  @Column("int")
  priceCents!: number;
}
