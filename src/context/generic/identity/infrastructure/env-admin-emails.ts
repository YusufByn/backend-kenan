import { Injectable } from "@nestjs/common";
import { env } from "@core/config/env.js";
import { AdminEmails } from "../domain/admin-emails.js";
import { User } from "../domain/user.js";

/** Lit ADMIN_EMAILS (liste séparée par des virgules) dans le .env. */
@Injectable()
export class EnvAdminEmails extends AdminEmails {
  private readonly emails = env.adminEmails.map((email) => User.normalizeEmail(email));

  list(): string[] {
    return this.emails;
  }
}
