import { Column, Entity, Index, PrimaryColumn } from "typeorm";

// Les deux tables sont dans le même fichier et sans relation TypeORM, comme pour les commandes.

@Entity("conversations")
@Index(["listingId", "buyerId"], { unique: true })
export class ConversationOrmEntity {
  @PrimaryColumn("varchar")
  id!: string;

  @Column("varchar")
  listingId!: string;

  @Column("varchar")
  listingTitle!: string;

  @Index()
  @Column("varchar")
  sellerId!: string;

  @Index()
  @Column("varchar")
  buyerId!: string;

  @Column("datetime")
  createdAt!: Date;

  @Column("datetime")
  lastMessageAt!: Date;

  @Column("datetime", { nullable: true })
  buyerLastReadAt!: Date | null;

  @Column("datetime", { nullable: true })
  sellerLastReadAt!: Date | null;
}

@Entity("messages")
@Index(["conversationId", "sentAt"])
export class MessageOrmEntity {
  @PrimaryColumn("varchar")
  id!: string;

  @Column("varchar")
  conversationId!: string;

  @Column("varchar")
  senderId!: string;

  @Column("text")
  body!: string;

  @Column("datetime")
  sentAt!: Date;
}
