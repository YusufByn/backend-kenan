import { Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import { AdminEmails } from "../../domain/admin-emails.js";
import { UserRepository } from "../../domain/user.repository.js";

/**
 * Déclenché par le démarrage du serveur, pas par une route : les comptes listés dans ADMIN_EMAILS
 * qui existent déjà deviennent admin (et sont réactivés). Ceux qui n'existent pas encore
 * seront admin dès leur inscription (RegisterUseCase).
 */
@Injectable()
export class BootstrapAdminsUseCase implements OnApplicationBootstrap {
  private readonly logger = new Logger("BootstrapAdmins");

  constructor(
    private readonly users: UserRepository,
    private readonly adminEmails: AdminEmails,
  ) {}

  onApplicationBootstrap(): Promise<void> {
    return this.execute();
  }

  async execute(): Promise<void> {
    const users = await this.users.findByEmails(this.adminEmails.list());
    for (const user of users) {
      if (!user.grantBootstrapAdmin()) continue;
      await this.users.save(user);
      this.logger.log(`${user.emailAddress} est admin (ADMIN_EMAILS)`);
    }
  }
}
