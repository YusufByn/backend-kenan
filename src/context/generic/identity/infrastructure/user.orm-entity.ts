import { Column, Entity, PrimaryColumn } from "typeorm";

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

  @Column("datetime")
  createdAt!: Date;
}
