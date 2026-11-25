import { Module } from "@nestjs/common";
import { IdentityModule } from "@identity";
import { UserNotifier } from "./common/user-notifier.js";
import { Mailer } from "./domain/mailer.js";
import { OrderCancelledEmailListener } from "./features/order-cancelled-email/order-cancelled-email.listener.js";
import { OrderDeliveredEmailsListener } from "./features/order-delivered-emails/order-delivered-emails.listener.js";
import { OrderPaidEmailsListener } from "./features/order-paid-emails/order-paid-emails.listener.js";
import { OrderPlacedEmailListener } from "./features/order-placed-email/order-placed-email.listener.js";
import { OrderShippedEmailListener } from "./features/order-shipped-email/order-shipped-email.listener.js";
import { WelcomeEmailListener } from "./features/welcome-email/welcome-email.listener.js";
import { ConsoleMailer } from "./infrastructure/console-mailer.js";

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
    WelcomeEmailListener,
    OrderPlacedEmailListener,
    OrderPaidEmailsListener,
    OrderShippedEmailListener,
    OrderDeliveredEmailsListener,
    OrderCancelledEmailListener,

    { provide: Mailer, useClass: ConsoleMailer },
  ],
})
export class NotificationsModule {}
