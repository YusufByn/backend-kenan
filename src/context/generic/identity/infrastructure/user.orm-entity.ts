import { Column, Entity, PrimaryColumn } from "typeorm";
import type { Role } from "../domain/role.js";

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

  /** Valeur par défaut : les comptes créés avant l'ajout des rôles deviennent "user". */
  @Column("varchar", { default: "user" })
  role!: Role;

  @Column("datetime", { nullable: true })
  suspendedAt!: Date | null;

  @Column("datetime")
  createdAt!: Date;
}
