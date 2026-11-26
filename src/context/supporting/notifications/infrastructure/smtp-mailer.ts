import { Injectable, Logger } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";
import { env } from "@core/config/env.js";
import { Mailer, type Email } from "../domain/mailer.js";

/**
 * Envoi réel par SMTP (Brevo, Mailgun, Gmail, Mailtrap en test...). Choisi par notifications.module.ts
 * dès que SMTP_HOST est défini. Une erreur d'envoi remonte au listener, qui est loggé par le bus sans casser la requête.
 */
@Injectable()
export class SmtpMailer extends Mailer {
  private readonly logger = new Logger("Mailer");
  private readonly transport: Transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465, // 465 = TLS direct ; 587 = STARTTLS
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
  });

  async send({ to, subject, text }: Email): Promise<void> {
    await this.transport.sendMail({ from: env.smtp.from, to, subject, text });
    this.logger.log(`Email envoyé à ${to} : ${subject}`);
  }
}
