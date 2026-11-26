/**
 * Remplit la base avec un jeu de démo réaliste : `npm run seed`.
 * VIDE LA BASE D'ABORD (toutes les tables). Refuse de tourner en production.
 *
 * Tout passe par les vrais use cases : les règles métier sont appliquées et les événements publiés,
 * exactement comme via l'API. C'est un outil de démarrage, au même niveau que app.module.ts :
 * il a le droit de connaître les use cases de tous les contextes (pas un contexte ne le connaît).
 */
import { NestFactory } from "@nestjs/core";
import { DataSource } from "typeorm";
import { env } from "@core/config/env.js";
import { AppModule } from "../app.module.js";
import { CreateListingUseCase } from "../context/core-domain/catalog/features/create-listing/create-listing.use-case.js";
import { PublishListingUseCase } from "../context/core-domain/catalog/features/publish-listing/publish-listing.use-case.js";
import { UpdateListingUseCase } from "../context/core-domain/catalog/features/update-listing/update-listing.use-case.js";
import { AddFavoriteUseCase } from "../context/core-domain/catalog/features/add-favorite/add-favorite.use-case.js";
import type { ListingDetails } from "../context/core-domain/catalog/domain/listing.js";
import { StartConversationUseCase } from "../context/core-domain/messaging/features/start-conversation/start-conversation.use-case.js";
import { SendMessageUseCase } from "../context/core-domain/messaging/features/send-message/send-message.use-case.js";
import { AddToCartUseCase } from "../context/core-domain/ordering/features/add-to-cart/add-to-cart.use-case.js";
import { CheckoutUseCase } from "../context/core-domain/ordering/features/checkout/checkout.use-case.js";
import { PayOrderUseCase } from "../context/core-domain/ordering/features/pay-order/pay-order.use-case.js";
import { ShipOrderUseCase } from "../context/core-domain/ordering/features/ship-order/ship-order.use-case.js";
import { ConfirmDeliveryUseCase } from "../context/core-domain/ordering/features/confirm-delivery/confirm-delivery.use-case.js";
import { CancelOrderUseCase } from "../context/core-domain/ordering/features/cancel-order/cancel-order.use-case.js";
import { CreateReviewUseCase } from "../context/core-domain/reviews/features/create-review/create-review.use-case.js";
import { ReplyToReviewUseCase } from "../context/core-domain/reviews/features/reply-to-review/reply-to-review.use-case.js";
import { RegisterUseCase } from "../context/generic/identity/features/register/register.use-case.js";
import { AdminChangeUserRoleUseCase } from "../context/generic/identity/features/admin-change-user-role/admin-change-user-role.use-case.js";
import { UserRepository } from "../context/generic/identity/domain/user.repository.js";

const PASSWORD = "password123";
const CLIENT = { userAgent: "seed", ip: "127.0.0.1" };
const ADDRESS = { fullName: "Yanis Benali", line1: "12 rue des Lilas", postalCode: "69003", city: "Lyon", country: "France" };

/** Photos de démo stables (même URL = même image). */
const photo = (seed: string) => `https://picsum.photos/seed/${seed}/1200/800`;

type ListingSeed = Omit<ListingDetails, "photoUrls"> & { photos: string[]; draft?: boolean };

const CAMILLE_LISTINGS: ListingSeed[] = [
  { title: "Vélo de route Canyon Endurace CF 7", description: "Cadre carbone, Shimano 105 Di2, entretenu en atelier chaque année. Pneus neufs.", brand: "Canyon", model: "Endurace CF 7", category: "road", frameSize: "M", wheelSize: "700c", condition: "very_good", year: 2022, priceCents: 189000, photos: ["canyon-1", "canyon-2"] },
  { title: "Gravel Specialized Diverge E5", description: "Parfait pour le bikepacking, porte-bagages inclus. Quelques rayures sur la base.", brand: "Specialized", model: "Diverge E5", category: "gravel", frameSize: "L", wheelSize: "700c", condition: "good", year: 2021, priceCents: 95000, photos: ["diverge-1"] },
  { title: "VTT Trek Marlin 7 semi-rigide", description: "Fourche RockShox, freins hydrauliques. Idéal pour débuter en forêt.", brand: "Trek", model: "Marlin 7", category: "mtb", frameSize: "M", wheelSize: "29", condition: "like_new", year: 2023, priceCents: 72000, photos: ["marlin-1", "marlin-2"] },
  { title: "Vélo de ville Gazelle Esprit", description: "Garde-boue, éclairage dynamo, panier avant. Très confortable.", brand: "Gazelle", model: "Esprit", category: "city", frameSize: "M", wheelSize: "700c", condition: "good", year: 2019, priceCents: 32000, photos: ["gazelle-1"] },
  { title: "BMX Mongoose Legion L40", description: "Pour le skatepark, pegs inclus.", brand: "Mongoose", model: "Legion L40", category: "bmx", frameSize: "S", wheelSize: "20", condition: "very_good", year: 2022, priceCents: 21000, photos: ["bmx-1"] },
  { title: "Vélo de route Bianchi Via Nirone (brouillon)", description: "", brand: "Bianchi", model: "Via Nirone 7", category: "road", frameSize: "S", wheelSize: "700c", condition: "needs_service", year: 2015, priceCents: 40000, photos: [], draft: true },
];

const LUCAS_LISTINGS: ListingSeed[] = [
  { title: "VAE Moustache Samedi 27 Xroad", description: "Moteur Bosch Performance, batterie 500 Wh (420 cycles). Chargeur fourni.", brand: "Moustache", model: "Samedi 27 Xroad 3", category: "ebike", frameSize: "L", wheelSize: "27.5", condition: "very_good", year: 2021, priceCents: 249000, photos: ["moustache-1", "moustache-2"] },
  { title: "VTT tout-suspendu Commencal Meta TR", description: "Enduro/trail, transmission SRAM GX, tige télescopique.", brand: "Commencal", model: "Meta TR", category: "mtb", frameSize: "L", wheelSize: "29", condition: "good", year: 2020, priceCents: 165000, photos: ["commencal-1"] },
  { title: "Vélo enfant Btwin 500 20 pouces", description: "Pour 6-9 ans, 6 vitesses.", brand: "Btwin", model: "500", category: "kids", frameSize: "XS", wheelSize: "20", condition: "good", year: 2020, priceCents: 9000, photos: ["kids-1"] },
  { title: "Vélo de ville Peugeot LC01", description: "Look vintage, révisé : câbles et patins neufs.", brand: "Peugeot", model: "LC01", category: "city", frameSize: "L", wheelSize: "700c", condition: "very_good", year: 2018, priceCents: 28000, photos: ["peugeot-1"] },
  { title: "Gravel Cannondale Topstone 2", description: "Shimano GRX, pneus tubeless 40 mm.", brand: "Cannondale", model: "Topstone 2", category: "gravel", frameSize: "M", wheelSize: "700c", condition: "like_new", year: 2023, priceCents: 115000, photos: ["topstone-1", "topstone-2"] },
  { title: "Vélo de route Cervélo R3 Ultegra", description: "Cadre très rigide, roues carbone Zipp 303 en option.", brand: "Cervélo", model: "R3", category: "road", frameSize: "M", wheelSize: "700c", condition: "very_good", year: 2020, priceCents: 210000, photos: ["cervelo-1"] },
];

async function main(): Promise<void> {
  if (env.isProduction) throw new Error("Le seeder vide la base : interdit en production");

  // Logs réduits aux warnings : les emails de démo (ConsoleMailer) ne polluent pas la sortie.
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ["warn", "error"] });
  const get = <T>(type: abstract new (...args: never[]) => T): T => app.get(type as never, { strict: false });

  console.log("Base vidée et recréée...");
  await get(DataSource).synchronize(true);

  // ---------- Comptes
  const register = get(RegisterUseCase);
  const users = get(UserRepository);
  const account = async (name: string, email: string) => {
    const { user } = await register.execute({ name, email, password: PASSWORD }, CLIENT);
    // Email vérifié directement : en vrai, le user clique sur le lien reçu.
    const entity = await users.getById(user.id);
    entity.verifyEmail(new Date());
    await users.save(entity);
    return user.id;
  };

  const admin = await account("Alex Admin", "admin@velo.test");
  const adminEntity = await users.getById(admin);
  adminEntity.grantBootstrapAdmin();
  await users.save(adminEntity);
  const moderator = await account("Morgane Modo", "modo@velo.test");
  await get(AdminChangeUserRoleUseCase).execute(admin, moderator, "moderator");
  const camille = await account("Camille Martin", "vendeur@velo.test");
  const lucas = await account("Lucas Bernard", "vendeur2@velo.test");
  const yanis = await account("Yanis Benali", "acheteur@velo.test");
  const ines = await account("Inès Durand", "acheteur2@velo.test");
  // Un compte à l'email pas encore vérifié, pour voir le parcours de vérification.
  await register.execute({ name: "Nouveau Venu", email: "nouveau@velo.test", password: PASSWORD }, CLIENT);

  // ---------- Annonces
  const createListing = get(CreateListingUseCase);
  const publish = get(PublishListingUseCase);
  const createAll = async (sellerId: string, seeds: ListingSeed[]) => {
    const ids: string[] = [];
    for (const { photos, draft, ...details } of seeds) {
      const listing = await createListing.execute(sellerId, { ...details, photoUrls: photos.map(photo) });
      if (!draft) await publish.execute(sellerId, listing.id);
      ids.push(listing.id);
    }
    return ids;
  };
  const [canyon, diverge, marlin, gazelle, bmx] = await createAll(camille, CAMILLE_LISTINGS);
  const [moustache, commencal, kids, peugeot, topstone] = await createAll(lucas, LUCAS_LISTINGS);

  // ---------- Commandes à tous les stades
  const cart = get(AddToCartUseCase);
  const checkout = get(CheckoutUseCase);
  const pay = get(PayOrderUseCase);
  const ship = get(ShipOrderUseCase);
  const confirm = get(ConfirmDeliveryUseCase);
  const buy = async (buyerId: string, listingIds: string[]) => {
    for (const id of listingIds) await cart.execute(buyerId, id);
    const [order] = await checkout.execute(buyerId, ADDRESS);
    return order!.id;
  };

  // Livrée + avis + réponse du vendeur
  const delivered = await buy(yanis, [gazelle!]);
  await pay.execute(yanis, delivered);
  await ship.execute(camille, delivered, "6A12345678901");
  await confirm.execute(yanis, delivered);
  const review = await get(CreateReviewUseCase).execute(yanis, { orderId: delivered, rating: 5, comment: "Vélo conforme à l'annonce, vendeuse très réactive. Je recommande !" });
  await get(ReplyToReviewUseCase).execute(camille, review.id, { reply: "Merci Yanis, bonne route avec la Gazelle !" });

  const delivered2 = await buy(ines, [kids!]);
  await pay.execute(ines, delivered2);
  await ship.execute(lucas, delivered2, "6A98765432109");
  await confirm.execute(ines, delivered2);
  await get(CreateReviewUseCase).execute(ines, { orderId: delivered2, rating: 4, comment: "Bon état, un peu de rouille sur la chaîne mais rien de grave." });

  // Expédiée (en attente de confirmation), payée (à expédier), en attente de paiement, annulée
  const shipped = await buy(ines, [bmx!]);
  await pay.execute(ines, shipped);
  await ship.execute(camille, shipped, "6A55555555555");
  const paid = await buy(yanis, [peugeot!]);
  await pay.execute(yanis, paid);
  await buy(ines, [topstone!]);
  const cancelled = await buy(yanis, [commencal!]);
  await get(CancelOrderUseCase).execute(yanis, cancelled);

  // ---------- Favoris + baisse de prix (déclenche l'email "baisse de prix")
  const favorite = get(AddFavoriteUseCase);
  await favorite.execute(yanis, canyon!);
  await favorite.execute(yanis, moustache!);
  await favorite.execute(ines, canyon!);
  await favorite.execute(ines, marlin!);
  await get(UpdateListingUseCase).execute(camille, canyon!, { priceCents: 175000 });

  // ---------- Messagerie
  const { conversation } = await get(StartConversationUseCase).execute(yanis, {
    listingId: moustache!,
    message: "Bonjour, la batterie tient combien de km en mode Tour ? Possible de l'essayer ce week-end ?",
  });
  await get(SendMessageUseCase).execute(lucas, conversation.id, { body: "Bonjour ! Environ 80 km en Tour. Oui, samedi matin à Lyon 7e ?" });
  await get(SendMessageUseCase).execute(yanis, conversation.id, { body: "Parfait, samedi 10h ça me va." });
  await get(StartConversationUseCase).execute(ines, { listingId: diverge!, message: "Le porte-bagages est compris dans le prix ?" });

  // Laisse les listeners (emails) finir avant de fermer la base.
  await new Promise((resolve) => setTimeout(resolve, 500));
  await app.close();

  console.log(`
Base remplie : 7 comptes, 12 annonces, 6 commandes, 2 avis, 4 favoris, 2 conversations.

Comptes (mot de passe : ${PASSWORD})
  admin@velo.test      admin (toutes les permissions)
  modo@velo.test       moderator
  vendeur@velo.test    Camille, 5 annonces en ligne + 1 brouillon, des ventes à tous les stades
  vendeur2@velo.test   Lucas, 6 annonces
  acheteur@velo.test   Yanis, des commandes, des favoris, une conversation
  acheteur2@velo.test  Inès
  nouveau@velo.test    email pas encore vérifié
`);
}

await main();
