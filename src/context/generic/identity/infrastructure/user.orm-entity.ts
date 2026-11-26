import { Column, Entity, PrimaryColumn } from "typeorm";
import { ROLE_PRESETS } from "../domain/role.js";

/**
 * Modèle de persistance (table "users"). Distinct de l'entité User du domaine :
 * le domaine reste pur, seul l'adapter TypeORM connaît cette classe.
 */
@Entity("users")
export class UserOrmEntity {
  @PrimaryColumn("varchar")
  id!: string;

  @Column("varchar")
  name!: string;

  @Column("varchar", { unique: true })
  email!: string;

  @Column("varchar")
  passwordHash!: string;

  /**
   * Masque de permissions. BIGINT en base, BigInt en JS : le driver renvoie un number (sûr jusqu'à 2^53,
   * donc jusqu'au bit 52), converti à la lecture. Valeur par défaut : les comptes créés avant les
   * permissions reçoivent le preset "user".
   */
  @Column("bigint", {
    default: ROLE_PRESETS.user.toString(),
    transformer: {
      to: (mask: bigint) => mask.toString(),
      from: (stored: number | string) => BigInt(stored),
    },
  })
  permissions!: bigint;

  @Column("datetime", { nullable: true })
  suspendedAt!: Date | null;

  @Column("datetime", { nullable: true })
  emailVerifiedAt!: Date | null;

  @Column("datetime")
  createdAt!: Date;
}
