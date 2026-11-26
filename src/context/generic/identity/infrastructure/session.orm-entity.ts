import { Column, Entity, Index, PrimaryColumn } from "typeorm";

/** Modèle de persistance (table "sessions"). Une ligne par connexion ouverte (login), même révoquée. */
@Entity("sessions")
export class SessionOrmEntity {
  @PrimaryColumn("varchar")
  id!: string;

  @Index()
  @Column("varchar")
  userId!: string;

  @Column("varchar")
  refreshTokenHash!: string;

  @Column("varchar", { nullable: true })
  userAgent!: string | null;

  @Column("varchar", { nullable: true })
  ip!: string | null;

  @Column("datetime")
  createdAt!: Date;

  @Column("datetime")
  lastUsedAt!: Date;

  @Column("datetime")
  expiresAt!: Date;

  @Column("datetime", { nullable: true })
  revokedAt!: Date | null;
}
