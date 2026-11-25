# Architecture

API **NestJS** organisée selon trois principes complémentaires :

| Niveau | Principe | Ce qu'il décide |
|---|---|---|
| Application | **DDD stratégique** (sous-domaines + bounded contexts) | Comment l'app est découpée en domaines métier |
| Contexte | **Vertical Slice** | Le code est rangé par fonctionnalité (`register/`), pas par couche technique (`controllers/`) |
| Slice | **Clean Architecture** | Les dépendances pointent vers le domaine ; le domaine ne dépend de rien |

---

## Vue d'ensemble

```
src/
├── main.ts                     Bootstrap : CORS, validation des DTO, filtre d'erreurs
├── app.module.ts               Assemble les modules des contextes
├── app.controller.ts           GET / → "API OK"
│
├── context/                    Les bounded contexts, rangés par catégorie de sous-domaine
│   ├── domain/                 Ce qui différencie le produit : la marketplace de vélos
│   │   ├── catalog/            ← annonces, recherche            (@catalog)
│   │   ├── ordering/           ← panier, commandes              (@ordering)
│   │   └── reviews/            ← avis sur les vendeurs          (@reviews)
│   ├── supporting/             Nécessaire mais pas différenciant
│   │   └── notifications/      ← emails, déclenchés par les événements (@notifications)
│   └── generic/                Résolu partout de la même façon
│       └── identity/           ← comptes + connexion JWT        (@identity)
│
└── core/                       Technique uniquement, zéro concept métier  (@core/*)
    ├── config/env.ts           ← lit le .env
    ├── database/is-unique-violation.ts
    ├── errors/domain-error.ts  ← base des erreurs (kind, errcode, fields)
    ├── events/                 ← bus d'événements : DomainEvent, EventBus (port), InMemoryEventBus
    └── http/
        ├── api-response.ts         ← types ApiSuccess / ApiError, withMeta()
        ├── api-response.interceptor.ts ← emballe tous les succès
        ├── api-exception.filter.ts ← format de toutes les erreurs
        └── request-validation.error.ts
```

### Les catégories de sous-domaines

- **`context/domain/`** : le cœur métier (*core domain* en DDD), là où l'app crée de la valeur. C'est là qu'on investit le plus (domaine riche, tests).
- **`context/supporting/`** : sert le cœur métier mais ne le différencie pas (notifications, back-office...).
- **`context/generic/`** : problèmes résolus de la même façon partout (identité, auth, paiement). On y reste léger et on s'appuie sur des librairies.
- **`core/`** : code technique sans propriétaire métier (le socle de l'app). **Interdit d'y mettre un concept métier** (`User`, `Booking`...) : si plusieurs contextes en ont besoin, il passe par la `public-api` du contexte qui le possède. Même règle pour les DTO : un DTO de requête reste dans sa slice, un DTO public (`UserDto`) reste dans le `public/` de son contexte. Seuls des DTO purement techniques (pagination générique...) ont leur place ici.

> À ne pas confondre : `context/domain/` est la **catégorie** des contextes cœur de métier ; `domain/` à l'intérieur d'un contexte est la **couche** métier (entités, ports).

Un contexte peut changer de catégorie avec le temps (un `supporting` qui devient cœur de métier) : on déplace le dossier (ex : `context/supporting/x` → `context/domain/x`) et on met à jour son alias dans `tsconfig.json`.

---

## Anatomie d'un contexte

Exemple avec `context/generic/identity/` :

```
identity/
├── domain/                              Le métier. Aucun import Nest.
│   ├── user.entity.ts                   Entité User + ses règles (nom requis, format email, mot de passe ≥ 8)
│   ├── user.errors.ts                   InvalidUserError, UserNotFoundError, EmailAlreadyUsedError, InvalidCredentialsError
│   ├── user.repository.ts               Port : stocker / retrouver des users (+ getById, assertEmailAvailable)
│   ├── password-hasher.ts               Port : hacher / vérifier un mot de passe
│   └── access-tokens.ts                 Port : délivrer / vérifier le jeton de connexion
│
├── features/                            Une slice = une action métier
│   ├── register/
│   │   ├── register.controller.ts       HTTP : route + DTO → appelle le handler
│   │   ├── register.handler.ts          Use case : orchestre domaine + ports
│   │   └── register.dto.ts              Forme de la requête (class-validator)
│   ├── login/
│   ├── get-me/
│   ├── update-me/
│   └── get-public-profile/
│
├── infrastructure/                      Adapters : implémentent les ports
│   ├── user.orm-entity.ts               Modèle de la table "users" (TypeORM), distinct de l'entité du domaine
│   ├── typeorm-user.repository.ts       UserRepository avec TypeORM
│   ├── scrypt-password-hasher.ts        PasswordHasher avec scrypt (inclus dans Node)
│   └── jwt-access-tokens.ts             AccessTokens avec JWT (@nestjs/jwt)
│
├── public/                              Ce que le contexte expose aux autres
│   ├── user-queries.ts                  Contrat (abstract class)
│   ├── user.dto.ts                      Forme publique d'un user
│   ├── identity-user-queries.ts         Implémentation du contrat (privée)
│   ├── jwt-auth.guard.ts                Protège une route (Authorization: Bearer)
│   └── current-user-id.decorator.ts     @CurrentUserId() : l'id du user connecté
│
├── identity.module.ts                   Câblage Nest : port → adapter, exports
└── public-api.ts                        Seul fichier importable depuis l'extérieur
```

### Rôle de chaque couche

| Couche | Responsabilité | Peut dépendre de |
|---|---|---|
| `domain/` | Entités, règles métier, ports, erreurs métier | `core/errors` uniquement |
| `features/*/` handler | Orchestrer un cas d'usage | `domain/` |
| `features/*/` controller + DTO | Traduire HTTP ↔ handler, valider la forme de la requête | son handler, Nest |
| `infrastructure/` | Implémenter les ports (stockage, services externes) | `domain/`, Nest, librairies |
| `public/` + `public-api.ts` | Exposer des capacités aux autres contextes | `domain/` |
| `*.module.ts` | Relier les ports à leurs implémentations | tout le contexte |

**DTO vs entité** : le DTO vérifie la *forme* de la requête (champ présent, type string). L'entité vérifie les *règles métier* (format d'email, nom non vide après trim). Les deux ne font pas doublon.

---

## Parcours d'une requête

`POST /auth/register` avec `{ "name": "Yusuf", "email": "y@test.com", "password": "..." }` :

```
Requête HTTP
   │
   ▼
ValidationPipe ──── body invalide / champ inconnu ──► RequestValidationError ──► 400
   │  (RegisterDto)
   ▼
RegisterController                      (renvoie les données brutes)
   │
   ▼
RegisterHandler                         (lance les erreurs)
   │  User.register(...) ── règle métier violée ──► InvalidUserError
   │                                                   │
   ▼                                                   ▼
UserRepository (port)                         ApiExceptionFilter ──► 400
   │
   ▼  injecté par le module
TypeOrmUserRepository (adapter) ──► SQLite (db.sqlite)
   │
   ▼
ApiResponseInterceptor (emballe automatiquement)
   │
   ▼
201 + { code: 201, data: { user: {...}, accessToken }, meta: null }
```

Le handler ne connaît que les **ports** (`UserRepository`, `PasswordHasher`, `AccessTokens`). C'est `identity.module.ts` qui décide quelle implémentation est injectée :

```ts
{ provide: UserRepository, useClass: TypeOrmUserRepository }
```

Changer de stockage = écrire un nouvel adapter et changer cette ligne. Le domaine et les slices ne bougent pas.

---

## Règles de dépendance

```
context/domain ───► context/supporting ───► context/generic ───► core
       └─────────────────────────────────────► context/generic

Événements :  supporting ┄┄écoute┄┄► domain   (notifications écoute ordering)
              supporting ┄┄écoute┄┄► generic  (notifications écoute UserRegistered d'identity)
```

1. **Le domaine est pur** : aucun import de Nest, d'infrastructure ou d'un autre contexte.
2. **Une slice n'importe jamais une autre slice.** Si deux slices partagent une logique, elle va dans `domain/`.
   *Exemple : `get-me`, `update-me` et `get-public-profile` ont besoin de « user introuvable → erreur » → c'est `UserRepository.getById()`. `register` et `update-me` vérifient qu'un email est libre → `UserRepository.assertEmailAvailable()`.*
3. **Un contexte n'importe jamais l'intérieur d'un autre contexte**, seulement sa `public-api` (via son alias).
4. **`context/generic/` ne connaît jamais `context/domain/`**, ni ses appels ni ses événements.
5. **Pour réagir à ce qui se passe ailleurs, on écoute un événement** au lieu de se faire appeler. Celui qui écoute importe les événements de l'émetteur (via sa `public-api`), l'émetteur ne sait pas qu'il est écouté. C'est ce qui permet à `context/supporting/notifications` de réagir à `context/domain/ordering` sans que `ordering` dépende de lui.
6. **`core/` ne contient que du technique** et ne dépend d'aucun contexte.

> Ces règles ne sont pas encore vérifiées automatiquement (voir [Limites actuelles](#limites-actuelles)).

### Où mettre du code partagé ?

| Besoin | Où | Exemple |
|---|---|---|
| Deux slices **du même contexte** partagent une logique | `domain/` du contexte | Validation de l'email dans `User` |
| Un contexte a besoin d'une capacité **d'un autre contexte** | `public-api.ts` du contexte propriétaire | `booking` vérifie qu'un user existe via `UserQueries` |
| Un contexte doit **réagir** à ce qui se passe ailleurs | Événement publié sur l'`EventBus` | `OrderPaid` → `notifications` envoie les emails |
| Du **technique** sans propriétaire métier | `core/` | `DomainError`, format des réponses, filtre d'exceptions |

---

## Communication entre contextes : la `public-api`

Chaque contexte expose un unique point d'entrée. Pour `identity` :

```ts
// context/generic/identity/public-api.ts
export { IdentityModule } from "./identity.module.js";
export { UserQueries } from "./public/user-queries.js";
export type { UserDto } from "./public/user.dto.js";
export { JwtAuthGuard } from "./public/jwt-auth.guard.js";
export { CurrentUserId } from "./public/current-user-id.decorator.js";
```

Un autre contexte l'utilise ainsi :

```ts
// 1. Son module importe IdentityModule
@Module({ imports: [IdentityModule], ... })

// 2. Son handler injecte le contrat, importé via l'alias
import { UserQueries } from "@identity";

constructor(private readonly users: UserQueries) {}
```

Points importants :

- **On expose un contrat (`UserDto`), jamais l'entité `User`.** Sinon les autres contextes dépendent du domaine interne d'`identity` et chaque modification les casse. Le consommateur traduit ensuite ce DTO dans son propre concept (ex : un `Customer` dans `booking`).
- **On expose une abstract class (`UserQueries`), pas un handler de slice.** `identity` peut réorganiser ses slices sans impacter personne.
- **Côté Nest**, c'est `exports: [UserQueries, AccessTokens]` dans `identity.module.ts` qui rend le contrat injectable ailleurs (`AccessTokens` est requis par `JwtAuthGuard`).
- **À l'intérieur d'un contexte**, les slices ne passent pas par la `public-api` : elles partagent via `domain/`.

---

## Authentification

Comptes et connexion vivent dans `identity` : un user est une personne qui a un compte, la connexion sert à prouver que c'est lui. Tout est dans le même contexte, ce qui évite une dépendance circulaire (la connexion a besoin des users, les routes `/me` ont besoin de savoir qui est connecté).

| Route | Accès | Rôle |
|---|---|---|
| `POST /auth/register` | public | Crée un compte, renvoie `{ user, accessToken }` |
| `POST /auth/login` | public | Renvoie `{ accessToken }` |
| `GET /me` | connecté | Mon profil |
| `PATCH /me` | connecté | Modifier mon nom ou mon email |
| `GET /users/:id` | public | Profil public : nom et date d'inscription, sans email |

- **Mot de passe** : haché avec scrypt (sel aléatoire, comparaison en temps constant), jamais renvoyé par l'API. `User.toProfile()` est la seule forme qui sort des handlers.
- **Token** : JWT signé (`sub` = id du user), valable 1 jour. Le client l'envoie dans `Authorization: Bearer <token>`.
- **Login** : même erreur 401 que l'email soit inconnu ou le mot de passe faux, pour ne pas révéler quels emails existent.

Protéger une route, dans n'importe quel contexte :

```ts
import { CurrentUserId, JwtAuthGuard } from "@identity";

@Controller("listings")
@UseGuards(JwtAuthGuard)                 // 401 si token absent, invalide ou expiré
export class CreateListingController {
  @Post()
  handle(@CurrentUserId() userId: string, @Body() dto: CreateListingDto) { ... }
}
```

Le module du contexte doit importer `IdentityModule`.

---

## La marketplace (context/domain/)

Des particuliers vendent leurs vélos, d'autres les achètent. Une annonce = un vélo (pas de stock).

### Qui appelle qui

```
reviews ──OrderQueries──► ordering ──ListingQueries / ListingReservations──► catalog ──UserQueries──► identity
   └──────────────────────────┴──────────────────── JwtAuthGuard, CurrentUserId ─────────────────────► identity
```

Toujours via la `public-api` du contexte appelé. `notifications` n'apparaît pas ici : personne ne l'appelle, il écoute les événements (voir [Événements](#événements)). `ListingReservations` (reserve / release / markSold) est la **seule** façon de changer le statut d'une annonce depuis un autre contexte ; les règles de transition restent dans l'entité `Listing`.

### Cycles de vie

```
Annonce   draft ──publish──► published ──checkout──► reserved ──livraison confirmée──► sold
                                  ▲                       │
                                  └──commande annulée─────┘
          draft | published ──DELETE──► archived

Commande  pending_payment ──pay──► paid ──ship──► shipped ──confirm-delivery──► delivered
          pending_payment | paid ──cancel──► cancelled   (annonces remises en vente)
```

### Routes

| Contexte | Méthode | Route | Accès |
|---|---|---|---|
| catalog | GET | `/listings` | public. Filtres : `q`, `category`, `brand`, `frameSize`, `wheelSize`, `condition`, `minPriceCents`, `maxPriceCents`, `sort` (`recent`, `price_asc`, `price_desc`), `page`, `limit` (≤ 50) |
| catalog | GET | `/listings/:id` | public (brouillons et archivées : 404) |
| catalog | POST | `/listings` | connecté, crée un brouillon |
| catalog | PATCH | `/listings/:id` | vendeur, si `draft` ou `published` |
| catalog | POST | `/listings/:id/publish` | vendeur, exige description + 1 photo |
| catalog | DELETE | `/listings/:id` | vendeur, archive (`data: null`) |
| catalog | GET | `/me/listings` | connecté, tous statuts |
| ordering | GET | `/cart` | connecté, prix relus, annonces indisponibles signalées |
| ordering | POST | `/cart/items` | connecté, `{ listingId }` (`data: null`) |
| ordering | DELETE | `/cart/items/:listingId` | connecté (`data: null`) |
| ordering | POST | `/checkout` | connecté, `{ shippingAddress }`, une commande par vendeur |
| ordering | GET | `/orders` | connecté, mes achats |
| ordering | GET | `/orders/:id` | acheteur ou vendeur |
| ordering | POST | `/orders/:id/pay` | acheteur (paiement simulé) |
| ordering | POST | `/orders/:id/ship` | vendeur, `{ trackingNumber }` |
| ordering | POST | `/orders/:id/confirm-delivery` | acheteur |
| ordering | POST | `/orders/:id/cancel` | acheteur ou vendeur, avant expédition |
| ordering | GET | `/me/sales` | connecté, mes ventes |
| reviews | POST | `/reviews` | acheteur d'une commande livrée, `{ orderId, rating, comment? }` |
| reviews | GET | `/sellers/:id/reviews` | public, avec moyenne |

### Points de conception

- **Ce qui n'appartient pas au user renvoie 404**, pas 403 : on ne révèle pas qu'une annonce ou commande existe. Le 403 est réservé au cas où l'on voit la commande mais sans le bon rôle (le vendeur qui essaie de payer).
- **Checkout tout ou rien** : les commandes sont validées avant de réserver ; si une seule annonce n'est plus disponible, rien n'est créé (409) ; si l'enregistrement des commandes échoue, les annonces sont libérées.
- **Deux acheteurs en même temps** : `TypeOrmListingRepository.saveAll` fait un `UPDATE ... WHERE status = <statut lu>`. Si le statut a changé entre-temps, la transaction est annulée et le second acheteur reçoit 409.
- **Titre et prix copiés dans `order_lines`** au checkout : modifier une annonce ensuite ne change pas la commande.
- **Pas de clé étrangère entre contextes** : `sellerId`, `listingId`, `orderId` sont de simples ids. Chaque contexte possède ses tables.

---

## Événements

Un contexte annonce ce qui vient de se passer ; d'autres y réagissent sans que l'émetteur les connaisse.

```
PayOrderHandler ── order.pay() ── orders.save() ── events.publish(new OrderPaid(...)) ──► réponse HTTP
                                                              │ (plus tard, sans bloquer la requête)
                                                              ▼
                                                 OrderPaidEmailsListener (notifications)
                                                   ├─► email à l'acheteur : paiement reçu
                                                   └─► email au vendeur : à expédier
```

### Les pièces

| Pièce | Où | Rôle |
|---|---|---|
| `DomainEvent` | `core/events/domain-event.ts` | Base de tout événement (`occurredAt`) |
| `EventBus` | `core/events/event-bus.ts` | Port : `publish(...events)`, `subscribe(EventClass, listener)` |
| `InMemoryEventBus` | `core/events/in-memory-event-bus.ts` | Implémentation en mémoire, injectée partout via `EventsModule` (global) |
| Les événements | `public/events/` du contexte émetteur, exportés par sa `public-api` | Font partie de son contrat |
| Les listeners | `features/<nom>/<nom>.listener.ts` du contexte qui réagit | S'abonnent dans `onModuleInit` |

### Événements publiés

| Événement | Émis par | Quand | Écouté par |
|---|---|---|---|
| `UserRegistered` | identity | inscription | notifications : bienvenue |
| `OrderPlaced` | ordering | checkout (un par commande) | notifications : récap à payer (acheteur) |
| `OrderPaid` | ordering | paiement | notifications : acheteur + vendeur |
| `OrderShipped` | ordering | expédition | notifications : numéro de suivi (acheteur) |
| `OrderDelivered` | ordering | réception confirmée | notifications : demande d'avis (acheteur) + vente terminée (vendeur) |
| `OrderCancelled` | ordering | annulation | notifications : prévient l'autre partie |

### Règles

- **Nommé au passé** : un fait déjà arrivé (`OrderPaid`), jamais un ordre (`SendEmail`).
- **Publié après l'enregistrement en base**, jamais avant : on n'annonce pas un paiement qui n'a pas été sauvegardé.
- **Que des valeurs simples** (ids, montants, titres), jamais une entité. Les événements de commande transportent une photo de la commande (`orderId`, `buyerId`, `sellerId`, `totalCents`, `itemTitles`) pour que les listeners n'aient pas à la relire.
- **`publish` ne bloque pas** : la requête répond sans attendre les listeners. **Un listener qui plante** est loggé (`[EventBus]`) et n'affecte ni la requête ni les autres listeners.
- **Événement ou appel direct ?** Événement pour les effets secondaires (emails). Appel direct via la `public-api` quand on a besoin du résultat tout de suite : `ordering` réserve les annonces via `ListingReservations`, il ne publie pas un événement en espérant que `catalog` suive.

### Le contexte `notifications`

- `domain/mailer.ts` : port `Mailer.send({ to, subject, text })`.
- `infrastructure/console-mailer.ts` : n'envoie rien, affiche l'email dans le terminal du serveur (`[Mailer] À : ... | Objet : ...`). Pour envoyer de vrais emails : écrire un `SmtpMailer` et changer une ligne dans `notifications.module.ts`.
- `common/user-notifier.ts` : retrouve l'email du destinataire via `UserQueries` (identity), puis envoie.
- Aucune route, rien d'exporté : il ne fait qu'écouter.

---

## Format des réponses

Toutes les réponses ont la même forme, et `code` vaut toujours le status HTTP.

**Succès** :

```json
{ "code": 200, "data": [ ... ], "meta": { "page": 1, "limit": 20, "total": 3 } }
```

- `data` : la ressource, la liste, ou `null` quand il n'y a rien à renvoyer (archiver, panier).
- `meta` : infos annexes aux données, aujourd'hui seulement la pagination de `GET /listings`. `null` sinon.

**Erreur** :

```json
{ "code": 400, "message": "Certains champs sont invalides", "fields": { "email": ["email must be an email"] }, "errcode": "VALIDATION_FAILED" }
```

- `message` : pour un humain, peut changer.
- `errcode` : stable, c'est lui que le front teste (`LISTING_NOT_FOUND`, `CART_EMPTY`...).
- `fields` : erreurs par champ (`"shippingAddress.city"` pour un champ imbriqué), `null` si l'erreur ne vient pas d'un champ.

### Qui fait quoi

1. **Le succès passe par le controller**, et l'emballage est automatique. Le controller renvoie les données brutes du handler. `ApiResponseInterceptor` (global, `main.ts`) les emballe en `{ code, data, meta }` :
   - `code` = le vrai status HTTP (200 par défaut, 201 pour un POST, ou celui de `@HttpCode`), donc jamais faux ;
   - `data` = ce que renvoie le controller, `null` s'il ne renvoie rien ;
   - `meta` = rempli seulement si le controller renvoie `withMeta(data, meta)` (`core/http/api-response.ts`), comme `GET /listings` pour la pagination.
2. **L'erreur passe par le service.** Les handlers et le domaine lancent des `DomainError`. Les controllers ne lancent rien et n'attrapent rien. `ApiExceptionFilter` est le seul endroit qui écrit une réponse d'erreur.
3. **Jamais d'erreur de la base dans la réponse.** Tout ce qui n'est ni une `DomainError` ni une erreur HTTP de Nest (erreur SQLite, bug...) devient un 500 `INTERNAL_ERROR` avec un message générique. Le détail (requête, table, valeur) part dans les logs du serveur. Quand une erreur de base a un sens métier (index UNIQUE violé par deux requêtes simultanées), le repository la traduit en `DomainError` avant qu'elle ne remonte (`isUniqueViolation`).

### `DomainError`

Chaque erreur déclare un `kind` (traduit en status) et un `errcode`. Le domaine ne connaît donc jamais HTTP.

```ts
export class EmailAlreadyUsedError extends DomainError {
  readonly kind = "conflict";
  readonly errcode = "EMAIL_ALREADY_USED";

  constructor() {
    super("Cet email est déjà utilisé", "email"); // 2e argument : le champ fautif → fields
  }
}
```

| `kind` | Status | Exemples d'`errcode` |
|---|---|---|
| `invalid` | 400 | `VALIDATION_FAILED` (DTO), `USER_INVALID`, `LISTING_INVALID`, `ORDER_INVALID`, `REVIEW_INVALID`, `CART_EMPTY`, `CANNOT_BUY_OWN_LISTING` |
| `unauthorized` | 401 | `TOKEN_MISSING`, `TOKEN_INVALID`, `INVALID_CREDENTIALS` |
| `forbidden` | 403 | `ORDER_ACTION_FORBIDDEN` |
| `not_found` | 404 | `USER_NOT_FOUND`, `LISTING_NOT_FOUND`, `ORDER_NOT_FOUND` |
| `conflict` | 409 | `EMAIL_ALREADY_USED`, `LISTING_NOT_AVAILABLE`, `LISTING_INVALID_STATUS`, `LISTING_CONCURRENT_UPDATE`, `CART_LISTING_UNAVAILABLE`, `ORDER_INVALID_STATUS`, `REVIEW_ORDER_NOT_DELIVERED`, `REVIEW_ALREADY_EXISTS` |

Les erreurs du DTO deviennent une `RequestValidationError` (`exceptionFactory` du `ValidationPipe` dans `main.ts`). Leurs messages sont ceux de class-validator, en anglais.

Erreurs levées par Nest lui-même : `errcode` = nom du status (`NOT_FOUND` pour une route inconnue, `BAD_REQUEST` pour un JSON mal formé ou un `:id` qui n'est pas un UUID).

---

## Recettes

### Ajouter une slice

Exemple : `deactivate-user` dans `identity`.

1. Créer `features/deactivate-user/` avec `deactivate-user.handler.ts`, `deactivate-user.controller.ts` (et un DTO si besoin).
2. Mettre la logique métier dans l'entité (`user.deactivate()`), pas dans le handler.
3. Dans le controller, renvoyer directement `this.handler.execute(...)` : l'intercepteur emballe la réponse. `@HttpCode(HttpStatus.OK)` sur un POST qui ne crée rien. Pas de try/catch : les erreurs remontent seules jusqu'au filtre.
4. Déclarer le controller et le handler dans `identity.module.ts`.

### Réagir à un événement

Exemple : prévenir le vendeur par email quand il reçoit un avis.

1. Dans `reviews` : créer `public/events/review-created.event.ts` (`class ReviewCreated extends DomainEvent`), l'exporter dans `public-api.ts`, et le publier dans `CreateReviewHandler` **après** `reviews.save()` : `this.events.publish(new ReviewCreated(...))`.
2. Dans `notifications` : créer `features/review-received-email/review-received-email.listener.ts`, qui s'abonne dans `onModuleInit` : `this.events.subscribe(ReviewCreated, (event) => this.handle(event))`.
3. Déclarer le listener dans `providers` de `notifications.module.ts`.

### Ajouter un contexte

Exemple : `context/domain/booking/`.

1. Créer `context/domain/booking/` avec `domain/`, `features/`, `infrastructure/`, `booking.module.ts` et `public-api.ts`.
2. Ajouter l'alias dans `tsconfig.json` :
   ```json
   "@booking": ["./src/context/domain/booking/public-api.ts"]
   ```
3. Importer `BookingModule` (via `@booking`) dans `app.module.ts`.
4. S'il a besoin d'`identity` (lire un user ou protéger des routes) : importer `IdentityModule` dans `booking.module.ts`, puis utiliser `UserQueries`, `JwtAuthGuard` et `CurrentUserId` depuis `@identity`.

### Base de données

La base est **SQLite** via **TypeORM** (driver `better-sqlite3`) : un fichier `db.sqlite` à la racine, créé au premier démarrage, ignoré par git. Rien à installer ni à lancer.

- **Config** : `TypeOrmModule.forRoot(...)` dans `app.module.ts`. `synchronize: true` crée les tables à partir des entités au démarrage (dev uniquement).
- **Repartir de zéro** : supprimer `db.sqlite` et relancer.
- **Entité ORM ≠ entité du domaine** : `UserOrmEntity` (dans `infrastructure/`) décrit la table ; l'adapter traduit avec `User.restore()` / `user.toPrimitives()`. Le domaine ne connaît pas TypeORM.

### Ajouter une table à un contexte

1. Créer `infrastructure/xxx.orm-entity.ts` (décorateurs `@Entity`, `@Column`...).
2. La déclarer dans le module du contexte : `imports: [TypeOrmModule.forFeature([XxxOrmEntity])]`.
3. L'injecter dans l'adapter avec `@InjectRepository(XxxOrmEntity)`.

### Passer à Postgres (ou autre)

1. `npm uninstall better-sqlite3 && npm install pg`
2. Dans `app.module.ts`, remplacer `type` / `database` par la config Postgres (`host`, `port`, `username`, `password`, `database`).

Les entités et les adapters ne changent pas.

---

## Conventions techniques

- **ESM** : le projet est en `"type": "module"` (Nest 12 n'est publié qu'en ESM). Les imports relatifs prennent l'extension **`.js`**, même si le fichier source est en `.ts` :
  ```ts
  import { User } from "./user.entity.js";
  ```
- **Alias** (`tsconfig.json` → `paths`), réécrits en chemins relatifs par `nest build` :
  - `@core/*` → `src/core/*`
  - `@identity` → `src/context/generic/identity/public-api.ts`
  - `@catalog` → `src/context/domain/catalog/public-api.ts`
  - `@ordering` → `src/context/domain/ordering/public-api.ts`
  - `@reviews` → `src/context/domain/reviews/public-api.ts`
  - `@notifications` → `src/context/supporting/notifications/public-api.ts`
- **Ports en `abstract class`** plutôt qu'en `interface` : une interface disparaît à la compilation, une abstract class sert directement de token d'injection Nest.
- **L'entité n'est jamais renvoyée telle quelle** : les handlers renvoient `toPrimitives()` (ou `toProfile()` pour un user, qui exclut le hash du mot de passe).
- **Prix en centimes** (`priceCents`, `totalCents`) : des entiers, jamais de flottants. 1 190 € = `119000`.
- **`ValidationPipe` avec `transform: true`** : les DTO sont de vraies instances, et `@Type(() => Number)` convertit les query params (`?page=2`) en nombres.
- **Pas de `tsx` / `esbuild`** : ils ne génèrent pas les métadonnées de décorateurs (`emitDecoratorMetadata`) dont Nest a besoin pour l'injection. On passe par la CLI Nest.

### Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur en watch mode (`nest start --watch`) |
| `npm run build` | Compile dans `dist/` |
| `npm start` | Lance `dist/main.js` |
| `npm run typecheck` | Vérifie les types sans compiler |

---

## Limites actuelles

- **`synchronize: true`** : pas de migrations. À remplacer par des migrations TypeORM avant une vraie mise en prod.
- **Configuration dans `.env`** (chargé par `src/core/config/env.ts` avec `process.loadEnvFile`, sans paquet) : `PORT`, `DATABASE_PATH`, `JWT_SECRET`, `JWT_EXPIRES_IN`. Modèle dans `.env.example`. Sans `.env`, des valeurs par défaut de dev sont utilisées. Pas de refresh token.
- **Règles de dépendance non vérifiées** : rien n'empêche encore un import interdit. À mettre en place avec `eslint-plugin-boundaries` ou `dependency-cruiser`.
- **Bus en mémoire** : si le serveur s'arrête entre l'enregistrement et l'exécution d'un listener, l'email est perdu, et un listener en échec n'est pas relancé. La solution propre (« outbox » : enregistrer l'événement en base dans la même transaction, puis le traiter) n'est pas en place.
- **Pas de rattrapage entre appels directs** : `ordering` appelle `ListingReservations`. Si une étape échoue après une autre (ex : annonces marquées vendues mais commande non enregistrée), rien ne corrige automatiquement, sauf au checkout où les annonces sont libérées.
- **Emails affichés, pas envoyés** : `ConsoleMailer` seulement.
- **Commandes non payées sans expiration** : une commande jamais payée bloque ses annonces jusqu'à ce que l'acheteur ou le vendeur l'annule.
- **Photos = URLs** : pas d'upload de fichiers.
- **Pas de tests automatisés** : le parcours complet a été vérifié à la main avec de vraies requêtes.
