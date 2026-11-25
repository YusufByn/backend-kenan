import { Column, Entity, PrimaryColumn } from "typeorm";

/** Table "cart_items" : le panier n'a pas de table à lui, c'est l'ensemble des lignes d'un user. */
@Entity("cart_items")
export class CartItemOrmEntity {
  @PrimaryColumn("varchar")
  userId!: string;

  @PrimaryColumn("varchar")
  listingId!: string;

  @Column("datetime")
  addedAt!: Date;
}
