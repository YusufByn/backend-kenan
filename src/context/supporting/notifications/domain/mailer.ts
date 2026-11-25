export type Email = { to: string; subject: string; text: string };

/** Port d'envoi d'email. Changer de fournisseur (SMTP, Brevo...) = un nouvel adapter, les listeners ne bougent pas. */
export abstract class Mailer {
  abstract send(email: Email): Promise<void>;
}
