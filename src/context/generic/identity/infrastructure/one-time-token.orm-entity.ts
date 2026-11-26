import { Column, Entity, Index, PrimaryColumn } from "typeorm";
import type { TokenPurpose } from "../domain/one-time-token.js";

/** Modèle de persistance (table "one_time_tokens") : liens de reset du mot de passe et de vérification d'email. */
@Entity("one_time_tokens")
@Index(["userId", "purpose"])
export class OneTimeTokenOrmEntity {
  @PrimaryColumn("varchar")
  id!: string;

  @Column("varchar")
  userId!: string;

  @Column("varchar")
  purpose!: TokenPurpose;

  @Column("varchar", { unique: true })
  tokenHash!: string;

  @Column("datetime")
  createdAt!: Date;

  @Column("datetime")
  expiresAt!: Date;

  @Column("datetime", { nullable: true })
  usedAt!: Date | null;
}
