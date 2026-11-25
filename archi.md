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
│   ├── core-domain/            Ce qui différencie le produit : la marketplace de vélos
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
    ├── database/                ← is-unique-violation.ts, escape-like.ts
    ├── bitmask/bitmask.ts       ← add, remove, hasAny, hasAll, isStrictSubset sur des BigInt
    ├── errors/domain-error.ts  ← base des erreurs (kind, errcode, fields)
    ├── events/                 ← bus d'événements : DomainEvent, EventBus (port), InMemoryEventBus
    └── http/
        ├── api-response.ts         ← types ApiSuccess / ApiError, withMeta()
        ├── api-response.interceptor.ts ← emballe tous les succès
        ├── api-exception.filter.ts ← format de toutes les erreurs
        └── request-validation.error.ts
```

### Les catégories de sous-domaines

- **`context/core-domain/`** : le cœur métier (*core domain* en DDD), là où l'app crée de la valeur. C'est là qu'on investit le plus (domaine riche, tests).
- **`context/supporting/`** : sert le cœur métier mais ne le différencie pas (notifications, back-office...).
- **`context/generic/`** : problèmes résolus de la même façon partout (identité, auth, paiement). On y reste léger et on s'appuie sur des librairies.
- **`core/`** : code technique sans propriétaire métier (le socle de l'app). **Interdit d'y mettre un concept métier** (`User`, `Booking`...) : si plusieurs contextes en ont besoin, il passe par la `public-api` du contexte qui le possède. Même règle pour les DTO : un DTO de requête reste dans sa slice, un DTO public (`UserDto`) reste dans le `public/` de son contexte. Seuls des DTO purement techniques (pagination générique...) ont leur place ici.

> À ne pas confondre : `context/core-domain/` (le cœur métier, au sens DDD) et `src/core/` (le socle technique, sans aucun métier). Et `domain/` à l'intérieur d'un contexte est la **couche** métier de ce contexte (entités, ports).

Un contexte peut changer de catégorie avec le temps (un `supporting` qui devient cœur de métier) : on déplace le dossier (ex : `context/supporting/x` → `context/core-domain/x`) et on met à jour son alias dans `tsconfig.json`.

---

## Anatomie d'un contexte

Exemple avec `context/generic/identity/` :

```
identity/
├── domain/                              Le métier. Aucun import Nest.
│   ├── user.ts                          Entité User + ses règles (nom requis, format email, mot de passe ≥ 8, permissions, suspension)
│   ├── permissions.ts                   Catalogue des permissions : 1 permission = 1 bit (source unique)
│   ├── role.ts                          Presets de masques : user, moderator, admin
│   ├── user.errors.ts                   InvalidUserError, UserNotFoundError, AccountSuspendedError, InsufficientRoleError...
│   ├── user.repository.ts               Port : stocker / retrouver / rechercher des users (+ getById, assertEmailAvailable)
│   ├── password-hasher.ts               Port : hacher / vérifier un mot de passe
│   ├── access-tokens.ts                 Port : délivrer / vérifier le jeton de connexion
│   └── admin-emails.ts                  Port : les emails toujours admin (ADMIN_EMAILS)
│
├── features/                            Une slice = une action métier
│   ├── register/
│   │   ├── register.controller.ts       HTTP : route + DTO → appelle le use case
│   │   ├── register.use-case.ts         Use case : orchestre domaine + ports
│   │   └── register.dto.ts              Forme de la requête (class-validator)
│   ├── login/
│   ├── get-me/
│   ├── update-me/
│   ├── get-public-profile/
│   ├── admin-list-users/                GET /admin/users
│   ├── admin-change-user-role/          PATCH /admin/users/:id/role (applique un preset)
│   ├── admin-change-user-permissions/   PATCH /admin/users/:id/permissions (grant / revoke)
│   ├── admin-suspend-user/              POST /admin/users/:id/suspend
│   ├── admin-reactivate-user/           POST /admin/users/:id/reactivate
│   └── bootstrap-admins/                Au démarrage : promeut les comptes ADMIN_EMAILS (pas de route)
│
├── infrastructure/                      Adapters : implémentent les ports
│   ├── user.orm-entity.ts               Modèle de la table "users" (TypeORM), distinct de l'entité du domaine
│   ├── typeorm-user.repository.ts       UserRepository avec TypeORM
│   ├── scrypt-password-hasher.ts        PasswordHasher avec scrypt (inclus dans Node)
│   ├── jwt-access-tokens.ts             AccessTokens avec JWT (@nestjs/jwt)
│   └── env-admin-emails.ts              AdminEmails lu dans le .env
│
├── public/                              Ce que le contexte expose aux autres
│   ├── user-queries.ts                  Contrat (abstract class)
│   ├── user.dto.ts                      Forme publique d'un user
│   ├── identity-user-queries.ts         Implémentation du contrat (privée)
│   ├── jwt-auth.guard.ts                Protège une route (Authorization: Bearer), relit le user en base
│   ├── require-permission.decorator.ts  @RequirePermission("ORDER_PLACE") + PermissionGuard
│   └── current-user-id.decorator.ts     @CurrentUserId() : l'id du user connecté
│
├── identity.module.ts                   Câblage Nest : port → adapter, exports
└── public-api.ts                        Seul fichier importable depuis l'extérieur
```

### Rôle de chaque couche

| Couche | Responsabilité | Peut dépendre de |
|---|---|---|
| `domain/` | Entités, règles métier, ports, erreurs métier | `core/errors`, `core/bitmask` uniquement |
| `features/*/` use case | Orchestrer un cas d'usage | `domain/` |
| `features/*/` controller + DTO | Traduire HTTP ↔ use case, valider la forme de la requête | son use case, Nest |
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
RegisterUseCase                         (lance les erreurs)
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

Le use case ne connaît que les **ports** (`UserRepository`, `PasswordHasher`, `AccessTokens`). C'est `identity.module.ts` qui décide quelle implémentation est injectée :

```ts
{ provide: UserRepository, useClass: TypeOrmUserRepository }
```

Changer de stockage = écrire un nouvel adapter et changer cette ligne. Le domaine et les slices ne bougent pas.

---

## Règles de dépendance

```
context/core-domain ───► context/supporting ───► context/generic ───► core
            └──────────────────────────────────────────► context/generic

Événements :  supporting ┄┄écoute┄┄► core-domain  (notifications écoute ordering)
              supporting ┄┄écoute┄┄► generic      (notifications écoute UserRegistered d'identity)
```

1. **Le domaine est pur** : aucun import de Nest, d'infrastructure ou d'un autre contexte.
2. **Une slice n'importe jamais une autre slice.** Si deux slices partagent une logique, elle va dans `domain/`.
   *Exemple : `get-me`, `update-me` et `get-public-profile` ont besoin de « user introuvable → erreur » → c'est `UserRepository.getById()`. `register` et `update-me` vérifient qu'un email est libre → `UserRepository.assertEmailAvailable()`.*
3. **Un contexte n'importe jamais l'intérieur d'un autre contexte**, seulement sa `public-api` (via son alias).
4. **`context/generic/` ne connaît jamais `context/core-domain/`**, ni ses appels ni ses événements.
5. **Pour réagir à ce qui se passe ailleurs, on écoute un événement** au lieu de se faire appeler. Celui qui écoute importe les événements de l'émetteur (via sa `public-api`), l'émetteur ne sait pas qu'il est écouté. C'est ce qui permet à `context/supporting/notifications` de réagir à `context/core-domain/ordering` sans que `ordering` dépende de lui.
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
export { RequirePermission } from "./public/require-permission.decorator.js";
export type { PermissionName } from "./domain/permissions.js";
```

Un autre contexte l'utilise ainsi :

```ts
// 1. Son module importe IdentityModule
@Module({ imports: [IdentityModule], ... })

// 2. Son use case injecte le contrat, importé via l'alias
import { UserQueries } from "@identity";

constructor(private readonly users: UserQueries) {}
```

Points importants :

- **On expose un contrat (`UserDto`), jamais l'entité `User`.** Sinon les autres contextes dépendent du domaine interne d'`identity` et chaque modification les casse. Le consommateur traduit ensuite ce DTO dans son propre concept (ex : un `Customer` dans `booking`).
- **On expose une abstract class (`UserQueries`), pas un use case de slice.** `identity` peut réorganiser ses slices sans impacter personne.
- **Côté Nest**, c'est `exports: [UserQueries, AccessTokens, UserRepository]` dans `identity.module.ts` qui rend le contrat injectable ailleurs (`AccessTokens` et `UserRepository` sont requis par `JwtAuthGuard` ; ils ne sont pas dans `public-api.ts`, donc aucun autre contexte ne peut les importer).
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
| `GET /admin/users` | `USERS_READ` | Comptes avec permissions, masque et suspension. Filtres : `q` (nom, email), `permission` (répétable : `?permission=A&permission=B` = a A **et** B), `status` (`active`, `suspended`), `page`, `limit` (≤ 50) |
| `PATCH /admin/users/:id/role` | `USERS_MANAGE_PERMISSIONS` | `{ role }` : remplace tout le masque par un preset |
| `PATCH /admin/users/:id/permissions` | `USERS_MANAGE_PERMISSIONS` | `{ grant?: [...], revoke?: [...] }` : ajoute / retire des permissions une par une |
| `POST /admin/users/:id/suspend` | `USERS_SUSPEND` | Seulement un compte qui a strictement moins de permissions que soi |
| `POST /admin/users/:id/reactivate` | `USERS_SUSPEND` | Mêmes règles |

- **Mot de passe** : haché avec scrypt (sel aléatoire, comparaison en temps constant), jamais renvoyé par l'API. `User.toProfile()` est la seule forme qui sort des use cases.
- **Token** : JWT signé (`sub` = id du user), valable 1 jour. Le client l'envoie dans `Authorization: Bearer <token>`.
- **Login** : même erreur 401 que l'email soit inconnu ou le mot de passe faux, pour ne pas révéler quels emails existent. La suspension (403) n'est signalée qu'après un mot de passe correct.
- **Le user est relu en base à chaque requête protégée** (`JwtAuthGuard`) : un compte suspendu est bloqué tout de suite (403 `ACCOUNT_SUSPENDED`, même avec un token encore valide), et un changement de permissions s'applique sans se reconnecter. Le token ne contient que l'id.

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

### Permissions (bitmask)

Chaque user a **un masque de permissions** : un entier (BIGINT en base, `bigint` en JS) où **chaque bit = une permission**. Vérifier un droit = un AND et une comparaison, sans jointure ni table `role_permissions`.

```
bit        20  19  18  17  16  ...  2   1   0
           │   │   │   │   │        │   │   └─ LISTING_SELL
           │   │   │   │   │        │   └───── ORDER_PLACE
           │   │   │   │   │        └───────── REVIEW_CREATE
           │   │   │   │   └────────────────── USERS_READ
           │   │   │   └────────────────────── USERS_SUSPEND
           │   │   └────────────────────────── USERS_MANAGE_PERMISSIONS
           │   └────────────────────────────── LISTINGS_MODERATE
           └────────────────────────────────── ORDERS_READ_ALL

user       0   0   0   0   0        1   1   1   = 7
moderator  1   1   0   1   1        1   1   1   = 1769479
admin      1   1   1   1   1        1   1   1   = 2031623
```

| Pièce | Où | Rôle |
|---|---|---|
| Opérations sur les bits | `core/bitmask/bitmask.ts` | `add` (OR), `remove` (AND NOT), `hasAny`, `hasAll`, `isStrictSubset`. Technique, sans métier |
| Catalogue | `identity/domain/permissions.ts` | **Source unique** : nom → bit, avec un tableau bit / permission / owner / description |
| Presets | `identity/domain/role.ts` | `user`, `moderator`, `admin` : de simples masques prêts à l'emploi |
| Masque du user | colonne `users.permissions` | C'est lui qui est vérifié, jamais le nom du rôle |
| Check HTTP | `@RequirePermission(...)` (`public/`) | `hasAll(masque du user, masque requis)` |

**Règles du catalogue** (en tête de `permissions.ts`) :

- **Nommer par domaine** : `<DOMAINE>_<ACTION>` (`LISTING_SELL`, `ORDERS_READ_ALL`).
- **Ne jamais changer ni réutiliser un bit**, même d'une permission supprimée : les masques déjà en base le donneraient à des gens qui ne l'ont jamais reçu. On retire la ligne et on note le bit dans « Bits retirés ».
- **Bits 0-15 : marketplace, 16+ : modération.** Le driver SQLite renvoie un `number` : sûr jusqu'au bit 52.
- **L'API parle en noms, la base en bits** : le client envoie `["ORDERS_READ_ALL"]` et reçoit `permissions: [...]` ; seule la vue admin montre le masque brut (`permissionsMask`, en chaîne car JSON ne sait pas sérialiser un BigInt).
- **Owner** : le contexte qui vérifie la permission. identity connaît le *nom* de `LISTING_SELL` (c'est lui qui gère les droits), mais jamais le code de catalog : la règle « generic ne connaît pas core-domain » tient au niveau du code.

**Rôles = presets.** Un rôle n'est qu'un raccourci pour remplir le masque (`PATCH /admin/users/:id/role`). On peut ensuite ajuster bit par bit (`PATCH .../permissions`) : retirer `LISTING_SELL` à un vendeur douteux sans le suspendre, donner `ORDERS_READ_ALL` à quelqu'un du support sans en faire un moderator. Le profil renvoie `role` quand le masque correspond exactement à un preset, `null` sinon.

**Règles métier** (dans l'entité `User`, en opérations de bits) :

- **Changer des permissions** : il faut `USERS_MANAGE_PERMISSIONS`, jamais sur son propre compte, et **on ne touche qu'aux bits qu'on possède** : `bitsModifiés = avant XOR après`, refusé si `!hasAll(masqueActeur, bitsModifiés)`. Quelqu'un qui gère les droits sans être modérateur ne peut donc pas fabriquer un admin.
- **Suspendre / réactiver** : il faut `USERS_SUSPEND`, jamais soi-même, et la cible doit avoir **strictement moins de permissions** : `isStrictSubset(cible, acteur)`. Un moderator ne suspend ni un autre moderator (masques égaux) ni quelqu'un qui a un droit qu'il n'a pas.
- **Acheteur et vendeur ne sont pas des permissions** : `LISTING_SELL` dit si on *peut* vendre, mais « est-ce *mon* annonce ? » reste une relation vérifiée par chaque contexte (`listing.isOwnedBy`, `order.isVisibleTo`).
- **Premier admin** : les emails listés dans `ADMIN_EMAILS` (`.env`) reçoivent toutes les permissions dès l'inscription, et à chaque démarrage s'ils existent déjà (y compris les permissions ajoutées au catalogue depuis). Un admin rétrogradé via l'API mais encore dans `ADMIN_EMAILS` redevient admin au prochain démarrage : le `.env` fait foi.
- **Routes de back-office sous `/admin/...`**, chacune dans le contexte qui possède la donnée (`/admin/users` dans identity, `/admin/listings` dans catalog, `/admin/orders` dans ordering).

Réserver une route, dans n'importe quel contexte :

```ts
import { CurrentUserId, RequirePermission } from "@identity";

@Controller("checkout")
@RequirePermission("ORDER_PLACE")           // plusieurs noms = il les faut tous. Inclut JwtAuthGuard : ne pas l'ajouter en plus
export class CheckoutController { ... }
```

Les noms sont convertis en masque une fois, au chargement du controller. 401 sans token valide, 403 `ACCOUNT_SUSPENDED` si le compte est suspendu, 403 `INSUFFICIENT_PERMISSIONS` (le message liste celles qui manquent) sinon.

**Ajouter une permission** : une ligne dans `PERMISSIONS` avec le prochain bit libre de sa plage, une ligne dans le tableau du commentaire, l'ajouter aux presets concernés dans `role.ts`, puis `@RequirePermission("NOUVELLE")` sur la route. Les users déjà en base ne l'ont pas : voir [Limites actuelles](#limites-actuelles).

---

## La marketplace (context/core-domain/)

Des particuliers vendent leurs vélos, d'autres les achètent. Une annonce = un vélo (pas de stock).

### Qui appelle qui

```
reviews ──OrderQueries──► ordering ──ListingQueries / ListingReservations──► catalog ──UserQueries──► identity
   └──────────────────────────┴──────────── JwtAuthGuard, RequirePermission, CurrentUserId ───────────► identity
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
| catalog | POST | `/listings` | `LISTING_SELL`, crée un brouillon |
| catalog | PATCH | `/listings/:id` | `LISTING_SELL` + vendeur, si `draft` ou `published` |
| catalog | POST | `/listings/:id/publish` | `LISTING_SELL` + vendeur, exige description + 1 photo |
| catalog | DELETE | `/listings/:id` | vendeur, archive (`data: null`) |
| catalog | GET | `/me/listings` | connecté, tous statuts |
| ordering | GET | `/cart` | connecté, prix relus, annonces indisponibles signalées |
| ordering | POST | `/cart/items` | `ORDER_PLACE`, `{ listingId }` (`data: null`) |
| ordering | DELETE | `/cart/items/:listingId` | connecté (`data: null`) |
| ordering | POST | `/checkout` | `ORDER_PLACE`, `{ shippingAddress }`, une commande par vendeur |
| ordering | GET | `/orders` | connecté, mes achats |
| ordering | GET | `/orders/:id` | acheteur ou vendeur |
| ordering | POST | `/orders/:id/pay` | acheteur (paiement simulé) |
| ordering | POST | `/orders/:id/ship` | vendeur, `{ trackingNumber }` |
| ordering | POST | `/orders/:id/confirm-delivery` | acheteur |
| ordering | POST | `/orders/:id/cancel` | acheteur ou vendeur, avant expédition |
| ordering | GET | `/me/sales` | connecté, mes ventes |
| reviews | POST | `/reviews` | `REVIEW_CREATE` + acheteur d'une commande livrée, `{ orderId, rating, comment? }` |
| reviews | GET | `/sellers/:id/reviews` | public, avec moyenne |
| catalog | DELETE | `/admin/listings/:id` | `LISTINGS_MODERATE`, archive l'annonce de n'importe quel vendeur (si `draft` ou `published`) |
| ordering | GET | `/admin/orders` | `ORDERS_READ_ALL`, toutes les commandes. Filtres : `status`, `buyerId`, `sellerId`, `page`, `limit` (≤ 50) |
| ordering | GET | `/admin/orders/:id` | `ORDERS_READ_ALL`, lecture seule |

### Points de conception

- **Ce qui n'appartient pas au user renvoie 404**, pas 403 : on ne révèle pas qu'une annonce ou commande existe. Le 403 est réservé au cas où l'on voit la commande mais sans le bon rôle (le vendeur qui essaie de payer), et aux routes protégées par `@RequirePermission` quand une permission manque. Les routes déjà engagées (payer, expédier, annuler, confirmer) ne demandent pas de permission : retirer `ORDER_PLACE` empêche de nouveaux achats, pas de terminer ceux en cours. La modération ne passe pas par les routes normales : un moderator qui appelle `GET /orders/:id` sur une commande qui n'est pas la sienne reçoit 404, il doit utiliser `GET /admin/orders/:id`.
- **Checkout tout ou rien** : les commandes sont validées avant de réserver ; si une seule annonce n'est plus disponible, rien n'est créé (409) ; si l'enregistrement des commandes échoue, les annonces sont libérées.
- **Deux acheteurs en même temps** : `TypeOrmListingRepository.saveAll` fait un `UPDATE ... WHERE status = <statut lu>`. Si le statut a changé entre-temps, la transaction est annulée et le second acheteur reçoit 409.
- **Titre et prix copiés dans `order_lines`** au checkout : modifier une annonce ensuite ne change pas la commande.
- **Pas de clé étrangère entre contextes** : `sellerId`, `listingId`, `orderId` sont de simples ids. Chaque contexte possède ses tables.

---

## Événements

Un contexte annonce ce qui vient de se passer ; d'autres y réagissent sans que l'émetteur les connaisse.

```
PayOrderUseCase ── order.pay() ── orders.save() ── events.publish(new OrderPaid(...)) ──► réponse HTTP
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

1. **Le succès passe par le controller**, et l'emballage est automatique. Le controller renvoie les données brutes du use case. `ApiResponseInterceptor` (global, `main.ts`) les emballe en `{ code, data, meta }` :
   - `code` = le vrai status HTTP (200 par défaut, 201 pour un POST, ou celui de `@HttpCode`), donc jamais faux ;
   - `data` = ce que renvoie le controller, `null` s'il ne renvoie rien ;
   - `meta` = rempli seulement si le controller renvoie `withMeta(data, meta)` (`core/http/api-response.ts`), comme `GET /listings` pour la pagination.
2. **L'erreur passe par le service.** Les use cases et le domaine lancent des `DomainError`. Les controllers ne lancent rien et n'attrapent rien. `ApiExceptionFilter` est le seul endroit qui écrit une réponse d'erreur.
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
| `forbidden` | 403 | `ORDER_ACTION_FORBIDDEN`, `ACCOUNT_SUSPENDED`, `INSUFFICIENT_PERMISSIONS`, `USER_ACTION_FORBIDDEN` |
| `not_found` | 404 | `USER_NOT_FOUND`, `LISTING_NOT_FOUND`, `ORDER_NOT_FOUND` |
| `conflict` | 409 | `EMAIL_ALREADY_USED`, `LISTING_NOT_AVAILABLE`, `LISTING_INVALID_STATUS`, `LISTING_CONCURRENT_UPDATE`, `CART_LISTING_UNAVAILABLE`, `ORDER_INVALID_STATUS`, `REVIEW_ORDER_NOT_DELIVERED`, `REVIEW_ALREADY_EXISTS`, `USER_ALREADY_SUSPENDED`, `USER_NOT_SUSPENDED` |

Les erreurs du DTO deviennent une `RequestValidationError` (`exceptionFactory` du `ValidationPipe` dans `main.ts`). Leurs messages sont ceux de class-validator, en anglais.

Erreurs levées par Nest lui-même : `errcode` = nom du status (`NOT_FOUND` pour une route inconnue, `BAD_REQUEST` pour un JSON mal formé ou un `:id` qui n'est pas un UUID).

---

## Recettes

### Ajouter une slice

Exemple : `deactivate-user` dans `identity`.

1. Créer `features/deactivate-user/` avec `deactivate-user.use-case.ts`, `deactivate-user.controller.ts` (et un DTO si besoin).
2. Mettre la logique métier dans l'entité (`user.deactivate()`), pas dans le use case.
3. Dans le controller, renvoyer directement `this.useCase.execute(...)` : l'intercepteur emballe la réponse. `@HttpCode(HttpStatus.OK)` sur un POST qui ne crée rien. Pas de try/catch : les erreurs remontent seules jusqu'au filtre.
4. Déclarer le controller et le use case dans `identity.module.ts`.

### Réagir à un événement

Exemple : prévenir le vendeur par email quand il reçoit un avis.

1. Dans `reviews` : créer `public/events/review-created.event.ts` (`class ReviewCreated extends DomainEvent`), l'exporter dans `public-api.ts`, et le publier dans `CreateReviewUseCase` **après** `reviews.save()` : `this.events.publish(new ReviewCreated(...))`.
2. Dans `notifications` : créer `features/review-received-email/review-received-email.listener.ts`, qui s'abonne dans `onModuleInit` : `this.events.subscribe(ReviewCreated, (event) => this.handle(event))`.
3. Déclarer le listener dans `providers` de `notifications.module.ts`.

### Ajouter un contexte

Exemple : `context/core-domain/booking/`.

1. Créer `context/core-domain/booking/` avec `domain/`, `features/`, `infrastructure/`, `booking.module.ts` et `public-api.ts`.
2. Ajouter l'alias dans `tsconfig.json` :
   ```json
   "@booking": ["./src/context/core-domain/booking/public-api.ts"]
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
  import { User } from "./user.js";
  ```
- **Alias** (`tsconfig.json` → `paths`), réécrits en chemins relatifs par `nest build` :
  - `@core/*` → `src/core/*`
  - `@identity` → `src/context/generic/identity/public-api.ts`
  - `@catalog` → `src/context/core-domain/catalog/public-api.ts`
  - `@ordering` → `src/context/core-domain/ordering/public-api.ts`
  - `@reviews` → `src/context/core-domain/reviews/public-api.ts`
  - `@notifications` → `src/context/supporting/notifications/public-api.ts`
- **Ports en `abstract class`** plutôt qu'en `interface` : une interface disparaît à la compilation, une abstract class sert directement de token d'injection Nest.
- **Nommage entité domaine / entité TypeORM** : l'entité du domaine porte le nom du concept, sans suffixe (`domain/user.ts`, classe `User`, aucun import TypeORM). Le suffixe `.orm-entity.ts` est réservé au modèle de table dans `infrastructure/`. On évite `.entity.ts`, qui désigne une entité TypeORM dans la convention NestJS.
- **L'entité n'est jamais renvoyée telle quelle** : les use cases renvoient `toPrimitives()` (ou `toProfile()` pour un user, qui exclut le hash du mot de passe).
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
- **Configuration dans `.env`** (chargé par `src/core/config/env.ts` avec `process.loadEnvFile`, sans paquet) : `PORT`, `DATABASE_PATH`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_EMAILS`. Modèle dans `.env.example`. Sans `.env`, des valeurs par défaut de dev sont utilisées. Pas de refresh token.
- **Règles de dépendance non vérifiées** : rien n'empêche encore un import interdit. À mettre en place avec `eslint-plugin-boundaries` ou `dependency-cruiser`.
- **Bus en mémoire** : si le serveur s'arrête entre l'enregistrement et l'exécution d'un listener, l'email est perdu, et un listener en échec n'est pas relancé. La solution propre (« outbox » : enregistrer l'événement en base dans la même transaction, puis le traiter) n'est pas en place.
- **Pas de rattrapage entre appels directs** : `ordering` appelle `ListingReservations`. Si une étape échoue après une autre (ex : annonces marquées vendues mais commande non enregistrée), rien ne corrige automatiquement, sauf au checkout où les annonces sont libérées.
- **Emails affichés, pas envoyés** : `ConsoleMailer` seulement.
- **Commandes non payées sans expiration** : une commande jamais payée bloque ses annonces jusqu'à ce que l'acheteur ou le vendeur l'annule.
- **Photos = URLs** : pas d'upload de fichiers.
- **`ADMIN_EMAILS` fait confiance à l'email, qui n'est pas vérifié** : quiconque s'inscrit le premier avec une adresse listée devient admin. Créer ces comptes soi-même avant de les ajouter au `.env`. À durcir avec une vérification d'email.
- **Suspension sans effet sur les annonces** : les annonces publiées d'un vendeur suspendu restent visibles et achetables. À traiter en publiant un événement `UserSuspended` qu'écouterait catalog.
- **Nouvelle permission = masques à migrer** : le masque est enregistré par user, donc une permission ajoutée au catalogue n'arrive pas toute seule chez les users existants (seuls les comptes `ADMIN_EMAILS` la reçoivent au démarrage). Il faut une migration (`UPDATE users SET permissions = permissions | <bit> WHERE ...`).
- **Masques limités au bit 52** : le driver SQLite renvoie un `number`. Au-delà, activer `safeIntegers` de better-sqlite3.
- **Pas d'historique de modération** : on ne garde ni qui a suspendu / changé des permissions / retiré une annonce, ni pourquoi, et le user concerné n'est pas prévenu par email.
- **Pas de tests automatisés** : le parcours complet a été vérifié à la main avec de vraies requêtes.
