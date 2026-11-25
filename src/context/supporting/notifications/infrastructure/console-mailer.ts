import { Injectable, Logger } from "@nestjs/common";
import { Mailer, type Email } from "../domain/mailer.js";

/** Adapter de dev : n'envoie rien, affiche l'email dans le terminal du serveur. */
@Injectable()
export class ConsoleMailer extends Mailer {
  private readonly logger = new Logger("Mailer");

  async send({ to, subject, text }: Email): Promise<void> {
    this.logger.log(`À : ${to} | Objet : ${subject}\n${text}`);
  }
}
