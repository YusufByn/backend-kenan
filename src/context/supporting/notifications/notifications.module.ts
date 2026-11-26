import { Module } from "@nestjs/common";
import { IdentityModule } from "@identity";
import { env } from "@core/config/env.js";
import { UserNotifier } from "./common/user-notifier.js";
import { Mailer } from "./domain/mailer.js";
import { AccountModerationEmailsListener } from "./features/account-moderation-emails/account-moderation-emails.listener.js";
import { EmailVerificationEmailListener } from "./features/email-verification-email/email-verification-email.listener.js";
import { NewMessageEmailListener } from "./features/new-message-email/new-message-email.listener.js";
import { OrderCancelledEmailListener } from "./features/order-cancelled-email/order-cancelled-email.listener.js";
import { OrderDeliveredEmailsListener } from "./features/order-delivered-emails/order-delivered-emails.listener.js";
import { OrderExpiredEmailsListener } from "./features/order-expired-emails/order-expired-emails.listener.js";
import { OrderPaidEmailsListener } from "./features/order-paid-emails/order-paid-emails.listener.js";
import { OrderPlacedEmailListener } from "./features/order-placed-email/order-placed-email.listener.js";
import { OrderShippedEmailListener } from "./features/order-shipped-email/order-shipped-email.listener.js";
import { PasswordChangedEmailListener } from "./features/password-changed-email/password-changed-email.listener.js";
import { PasswordResetEmailListener } from "./features/password-reset-email/password-reset-email.listener.js";
import { PriceDropEmailsListener } from "./features/price-drop-emails/price-drop-emails.listener.js";
import { ReviewEmailsListener } from "./features/review-emails/review-emails.listener.js";
import { WelcomeEmailListener } from "./features/welcome-email/welcome-email.listener.js";
import { ConsoleMailer } from "./infrastructure/console-mailer.js";
import { SmtpMailer } from "./infrastructure/smtp-mailer.js";

/**
 * Réagit aux événements des autres contextes en envoyant des emails.
 * Aucune route HTTP, rien d'exporté : personne n'appelle notifications, il écoute le bus.
 */
@Module({
  imports: [
    IdentityModule, // UserQueries, pour retrouver l'email du destinataire
  ],
  providers: [
    UserNotifier,
    // Compte (identity)
    WelcomeEmailListener,
    EmailVerificationEmailListener,
    PasswordResetEmailListener,
    PasswordChangedEmailListener,
    AccountModerationEmailsListener,
    // Commandes (ordering)
    OrderPlacedEmailListener,
    OrderPaidEmailsListener,
    OrderShippedEmailListener,
    OrderDeliveredEmailsListener,
    OrderCancelledEmailListener,
    OrderExpiredEmailsListener,
    // Annonces, avis, messages (catalog, reviews, messaging)
    PriceDropEmailsListener,
    ReviewEmailsListener,
    NewMessageEmailListener,

    // SMTP_HOST défini → vrais emails ; sinon affichés dans le terminal.
    { provide: Mailer, useClass: env.smtp.host ? SmtpMailer : ConsoleMailer },
  ],
})
export class NotificationsModule {}
