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
├── main.ts                     Bootstrap : helmet, CORS, validation des DTO, filtre d'erreurs, Swagger (/docs), /uploads
├── app.module.ts               Assemble les modules + limite de requêtes, tâches planifiées, log des requêtes
├── app.controller.ts           GET / → health check (API + base)
├── seed/seed.ts                npm run seed : vide la base et la remplit avec un jeu de démo
│
├── context/                    Les bounded contexts, rangés par catégorie de sous-domaine
│   ├── core-domain/            Ce qui différencie le produit : la marketplace de vélos
│   │   ├── catalog/            ← annonces, recherche, favoris                 (@catalog)
│   │   ├── ordering/           ← panier, commandes, expiration, livraison     (@ordering)
│   │   ├── reviews/            ← avis sur les vendeurs, réponses, modération  (@reviews)
│   │   └── messaging/          ← messagerie acheteur / vendeur                (@messaging)
│   ├── supporting/             Nécessaire mais pas différenciant
│   │   ├── notifications/      ← emails, déclenchés par les événements        (@notifications)
│   │   └── media/              ← upload des photos                            (@media)
│   └── generic/                Résolu partout de la même façon
│       └── identity/           ← comptes, sessions, vérification d'email      (@identity)
│
└── core/                       Technique uniquement, zéro concept métier  (@core/*)
    ├── config/env.ts           ← lit le .env (refuse de démarrer en prod sans JWT_SECRET)
    ├── database/               ← is-unique-violation.ts, escape-like.ts
    ├── bitmask/bitmask.ts      ← add, remove, hasAny, hasAll, isStrictSubset sur des BigInt
    ├── errors/domain-error.ts  ← base des erreurs (kind, errcode, fields)
    ├── events/                 ← bus d'événements : DomainEvent, EventBus (port), InMemoryEventBus
    └── http/
        ├── api-response.ts             ← types ApiSuccess / ApiError, withMeta(), withPage()
        ├── api-response.interceptor.ts ← emballe tous les succès
        ├── api-exception.filter.ts     ← format de toutes les erreurs
        ├── pagination.ts               ← PaginationQuery (?page&limit), Page<T>, offsetOf()
        ├── rate-limit.ts               ← limite globale + @StrictRateLimit()
        ├── request-logger.middleware.ts ← une ligne de log par requête
        ├── swagger.ts                  ← documentation /docs
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
│   ├── session.ts                       Entité Session : une connexion ouverte sur un appareil (refresh token, révocation)
│   ├── session.repository.ts            Port : stocker / retrouver / révoquer des sessions (+ getOwnedBy, saveRotation)
│   ├── session.errors.ts                InvalidRefreshTokenError, SessionNotFoundError
│   ├── session-issuer.ts                Service : ouvre une session / fait tourner son refresh token (register, login, refresh)
│   ├── one-time-token.ts                Entité OneTimeToken : lien envoyé par email (reset 1 h, vérification 48 h, usage unique)
│   ├── one-time-token.repository.ts     Port : stocker / consommer / annuler les jetons
│   ├── one-time-token-issuer.ts         Service : crée un jeton (annule les précédents) / le consomme
│   ├── password-hasher.ts               Port : hacher / vérifier un mot de passe
│   ├── access-tokens.ts                 Port : délivrer / vérifier l'access token (userId + sessionId)
│   ├── secret-tokens.ts                 Port : jetons opaques aléatoires et leur empreinte (refresh, reset)
│   └── admin-emails.ts                  Port : les emails toujours admin (ADMIN_EMAILS)
│
├── features/                            Une slice = une action métier
│   ├── register/
│   │   ├── register.controller.ts       HTTP : route + DTO → appelle le use case
│   │   ├── register.use-case.ts         Use case : orchestre domaine + ports
│   │   └── register.dto.ts              Forme de la requête (class-validator)
│   ├── login/
│   ├── refresh-session/                 POST /auth/refresh
│   ├── logout/                          POST /auth/logout
│   ├── logout-all/                      POST /auth/logout-all
│   ├── verify-email/                    POST /auth/verify-email
│   ├── resend-verification/             POST /auth/resend-verification
│   ├── forgot-password/                 POST /auth/forgot-password
│   ├── reset-password/                  POST /auth/reset-password
│   ├── get-me/
│   ├── update-me/
│   ├── change-password/                 PATCH /me/password
│   ├── list-my-sessions/                GET /me/sessions
│   ├── revoke-my-session/               DELETE /me/sessions/:id
│   ├── get-public-profile/
│   ├── admin-list-users/                GET /admin/users
│   ├── admin-change-user-role/          PATCH /admin/users/:id/role (applique un preset)
│   ├── admin-change-user-permissions/   PATCH /admin/users/:id/permissions (grant / revoke)
│   ├── admin-suspend-user/              POST /admin/users/:id/suspend
│   ├── admin-reactivate-user/           POST /admin/users/:id/reactivate
│   ├── bootstrap-admins/                Au démarrage : promeut les comptes ADMIN_EMAILS vérifiés (pas de route)
│   └── purge-expired-auth-data/         Chaque nuit : supprime sessions et jetons expirés (.job.ts, pas de route)
│
├── infrastructure/                      Adapters : implémentent les ports
│   ├── user.orm-entity.ts               Modèle de la table "users" (TypeORM), distinct de l'entité du domaine
│   ├── typeorm-user.repository.ts       UserRepository avec TypeORM
│   ├── session.orm-entity.ts            Table "sessions"
│   ├── typeorm-session.repository.ts    SessionRepository avec TypeORM
│   ├── one-time-token.orm-entity.ts     Table "one_time_tokens"
│   ├── typeorm-one-time-token.repository.ts
│   ├── scrypt-password-hasher.ts        PasswordHasher avec scrypt (inclus dans Node)
│   ├── jwt-access-tokens.ts             AccessTokens avec JWT (@nestjs/jwt)
│   ├── crypto-secret-tokens.ts          SecretTokens : 32 octets aléatoires, empreinte SHA-256
│   └── env-admin-emails.ts              AdminEmails lu dans le .env
│
├── public/                              Ce que le contexte expose aux autres
│   ├── user-queries.ts                  Contrat (abstract class)
│   ├── user.dto.ts                      Forme publique d'un user
│   ├── identity-user-queries.ts         Implémentation du contrat (privée)
│   ├── jwt-auth.guard.ts                Protège une route (Authorization: Bearer), relit la session et le user en base
│   ├── require-permission.decorator.ts  @RequirePermission("ORDER_PLACE") + PermissionGuard
│   ├── current-user-id.decorator.ts     @CurrentUserId() : l'id du user connecté
│   ├── current-session-id.decorator.ts  @CurrentSessionId() : la session de la requête (interne à identity)
│   └── events/                          UserRegistered, EmailVerificationRequested, PasswordResetRequested,
│                                        PasswordChanged, UserSuspended, UserReactivated
│
├── identity.module.ts                   Câblage Nest : port → adapter, exports
└── public-api.ts                        Seul fichier importable depuis l'extérieur
```

### Rôle de chaque couche

| Couche | Responsabilité | Peut dépendre de |
|---|---|---|
| `domain/` | Entités, règles métier, ports, erreurs métier, services du domaine | `core/errors`, `core/bitmask`, les types de `core/http/pagination` |
| `features/*/` use case | Orchestrer un cas d'usage | `domain/` |
| `features/*/` listener (`.listener.ts`) / job (`.job.ts`) | Comme un use case, mais déclenché par un événement ou par l'horloge (`@Cron`) au lieu d'une route | `domain/`, la `public-api` qui publie l'événement |
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

> **Vérifiées automatiquement** : `npm run lint:archi` ([dependency-cruiser](https://github.com/sverweij/dependency-cruiser), config dans `.dependency-cruiser.cjs`) échoue au premier import interdit et dit lequel.

| Règle (`.dependency-cruiser.cjs`) | Ce qu'elle interdit |
|---|---|
| `domaine-pur` | `domain/` qui importe Nest, TypeORM, `infrastructure/`, `features/`, `public/` ou un autre contexte |
| `contexte-via-public-api` | Importer autre chose que la `public-api.ts` d'un autre contexte |
| `slice-isolee` | Une slice qui importe une autre slice |
| `generic-ignore-le-metier` | `generic/` qui importe `core-domain/` ou `supporting/` |
| `supporting-ecoute-seulement` | `supporting/` qui importe le module d'un contexte du cœur métier (il n'en écoute que les événements) |
| `core-sans-metier` | `src/core` qui importe un contexte |
| `pas-de-cycle-entre-contextes` | Deux contextes qui dépendent l'un de l'autre |

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
- **Côté Nest**, c'est `exports: [UserQueries, AccessTokens, SessionRepository, UserRepository]` dans `identity.module.ts` qui rend le contrat injectable ailleurs (`AccessTokens`, `SessionRepository` et `UserRepository` sont requis par `JwtAuthGuard` ; ils ne sont pas dans `public-api.ts`, donc aucun autre contexte ne peut les importer).
- **À l'intérieur d'un contexte**, les slices ne passent pas par la `public-api` : elles partagent via `domain/`.

---

## Authentification

Comptes et connexion vivent dans `identity` : un user est une personne qui a un compte, la connexion sert à prouver que c'est lui. Tout est dans le même contexte, ce qui évite une dépendance circulaire (la connexion a besoin des users, les routes `/me` ont besoin de savoir qui est connecté).

| Route | Accès | Rôle |
|---|---|---|
| `POST /auth/register` | public | Crée un compte, ouvre une session et envoie un lien de vérification. Renvoie `{ user, accessToken, refreshToken }` |
| `POST /auth/login` | public | Ouvre une session, renvoie `{ accessToken, refreshToken }` |
| `POST /auth/refresh` | public | `{ refreshToken }` → nouveaux `{ accessToken, refreshToken }` (l'ancien refresh token ne marche plus) |
| `POST /auth/logout` | connecté | Ferme la session de la requête |
| `POST /auth/logout-all` | connecté | Ferme toutes mes sessions, celle-ci comprise |
| `POST /auth/verify-email` | public | `{ token }` (reçu par email) → email vérifié |
| `POST /auth/resend-verification` | connecté | Renvoie un lien de vérification (l'ancien ne marche plus) |
| `POST /auth/forgot-password` | public | `{ email }` → envoie un lien de reset. Répond 200 même si l'email n'existe pas |
| `POST /auth/reset-password` | public | `{ token, newPassword }` → change le mot de passe et ferme toutes les sessions |
| `GET /me` | connecté | Mon profil |
| `PATCH /me` | connecté | Modifier mon nom ou mon email (un nouvel email n'est plus vérifié : un lien part à la nouvelle adresse) |
| `PATCH /me/password` | connecté | `{ currentPassword, newPassword }` → ferme mes autres sessions |
| `GET /me/sessions` | connecté | Mes appareils connectés (`userAgent`, `ip`, `lastUsedAt`, `current`) |
| `DELETE /me/sessions/:id` | connecté | Déconnecte un de mes appareils |
| `GET /users/:id` | public | Profil public : nom et date d'inscription, sans email |
| `GET /admin/users` | `USERS_READ` | Comptes avec permissions, masque et suspension. Filtres : `q` (nom, email), `permission` (répétable : `?permission=A&permission=B` = a A **et** B), `status` (`active`, `suspended`), `page`, `limit` (≤ 50) |
| `PATCH /admin/users/:id/role` | `USERS_MANAGE_PERMISSIONS` | `{ role }` : remplace tout le masque par un preset |
| `PATCH /admin/users/:id/permissions` | `USERS_MANAGE_PERMISSIONS` | `{ grant?: [...], revoke?: [...] }` : ajoute / retire des permissions une par une |
| `POST /admin/users/:id/suspend` | `USERS_SUSPEND` | Seulement un compte qui a strictement moins de permissions que soi |
| `POST /admin/users/:id/reactivate` | `USERS_SUSPEND` | Mêmes règles |

- **Mot de passe** : haché avec scrypt (sel aléatoire, comparaison en temps constant), jamais renvoyé par l'API. `User.toProfile()` est la seule forme qui sort des use cases.
- **Login** : même erreur 401 que l'email soit inconnu ou le mot de passe faux, pour ne pas révéler quels emails existent, **et même temps de réponse** : pour un email inconnu, un faux hash est vérifié quand même (sinon la réponse instantanée trahirait que le compte n'existe pas). La suspension (403) n'est signalée qu'après un mot de passe correct.
- **Limite de tentatives** : 5 essais par minute et par IP sur `login`, `register`, `forgot-password`, `reset-password`, `verify-email`, `resend-verification` (`@StrictRateLimit()`), 120 par minute sur le reste. Au-delà : 429 `TOO_MANY_REQUESTS` avec l'en-tête `Retry-After`.
- **Le user et la session sont relus en base à chaque requête protégée** (`JwtAuthGuard`) : un compte suspendu est bloqué tout de suite (403 `ACCOUNT_SUSPENDED`, même avec un token encore valide), une session fermée aussi (401 `TOKEN_INVALID`), et un changement de permissions s'applique sans se reconnecter.

### Sessions, access token et refresh token

Chaque login (ou inscription) ouvre une **session** : une ligne de la table `sessions`, une par appareil. Le client reçoit deux jetons :

| Jeton | Forme | Durée | Sert à |
|---|---|---|---|
| `accessToken` | JWT signé `{ sub: userId, sid: sessionId }` | `JWT_EXPIRES_IN` (15 min) | Chaque requête : `Authorization: Bearer <accessToken>` |
| `refreshToken` | `<sessionId>.<secret>` opaque | `SESSION_TTL_DAYS` (30 j) sans être utilisé | Seulement `POST /auth/refresh`, quand l'access token a expiré |

```
login ──► { accessToken, refreshToken }
  │
  ├─ requêtes avec l'accessToken ... 401 TOKEN_INVALID (expiré)
  │
  └─ POST /auth/refresh { refreshToken } ──► nouveaux { accessToken, refreshToken }   (l'ancien refresh token est mort)
                                         └─► 401 REFRESH_TOKEN_INVALID → renvoyer vers l'écran de login
```

- **Révocable tout de suite** : le `sid` de l'access token est vérifié à chaque requête. Logout, changement de mot de passe, reset ou suspension ferment la session, et ses access tokens encore valides sont refusés dès la requête suivante.
- **Rotation** : chaque refresh token ne sert qu'une fois. La base ne garde que l'empreinte SHA-256 du secret (`SecretTokens`), jamais le secret.
- **Vol détecté** : un ancien refresh token rejoué (bonne session, mauvais secret) ferme la session. Le voleur et le titulaire doivent se reconnecter, et seul le titulaire connaît le mot de passe.
- **Refresh concurrent** : la rotation est une mise à jour conditionnelle (`saveRotation` : seulement si la session est ouverte et porte encore l'ancienne empreinte). Deux refresh simultanés avec le même token : un seul gagne, l'autre reçoit 401. **Côté front, un seul refresh à la fois** (mettre les requêtes en attente pendant le refresh), sinon la session est fermée comme pour un vol. Un logout concurrent n'est jamais annulé par un refresh.
- **Session prolongée à chaque refresh** : elle expire après `SESSION_TTL_DAYS` jours *sans activité*, pas de durée maximale absolue.

| Action | Sessions fermées |
|---|---|
| `POST /auth/logout` | celle de la requête |
| `DELETE /me/sessions/:id` | celle-là |
| `POST /auth/logout-all` | toutes |
| `PATCH /me/password` | toutes sauf celle de la requête (+ liens de reset en cours annulés) |
| `POST /auth/reset-password` | toutes |
| `POST /admin/users/:id/suspend` | toutes : une réactivation ne reconnecte pas |

### Mot de passe oublié

1. `POST /auth/forgot-password { email }` : répond toujours 200. Si le compte existe et n'est pas suspendu, un `OneTimeToken` `password_reset` est créé (1 h, usage unique, les précédents sont annulés) et `PasswordResetRequested` est publié avec le jeton en clair.
2. `notifications` envoie le lien `FRONTEND_URL/reset-password?token=...`. Le jeton n'existe en clair que dans cet email : la base ne garde que son empreinte.
3. Le front appelle `POST /auth/reset-password { token, newPassword }`. 400 `RESET_TOKEN_INVALID` si le lien est inconnu, expiré, déjà utilisé ou remplacé.
4. Toutes les sessions sont fermées, `PasswordChanged` prévient le user par email. Il se reconnecte avec `POST /auth/login`.

### Vérification d'email

Même mécanisme (`OneTimeToken`, purpose `email_verification`, 48 h) :

1. À l'inscription, et à chaque changement d'email via `PATCH /me`, `EmailVerificationRequested` part avec le jeton et **la nouvelle adresse**. Le profil renvoie `emailVerified: false`.
2. Le lien `FRONTEND_URL/verify-email?token=...` mène le front à `POST /auth/verify-email { token }`. Pas besoin d'être connecté : on peut ouvrir l'email sur un autre appareil.
3. **`ADMIN_EMAILS` exige un email vérifié** : une adresse listée ne devient admin qu'une fois vérifiée (au moment de la vérification, puis à chaque démarrage). S'inscrire le premier avec cette adresse ne suffit plus, il faut pouvoir lire ses emails.

**Consommer un jeton est atomique** : `markUsed` est un `UPDATE ... WHERE usedAt IS NULL`. Deux clics simultanés sur le même lien : un seul passe.

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
bit        21  20  19  18  17  16  ...  3   2   1   0
           │   │   │   │   │   │        │   │   │   └─ LISTING_SELL
           │   │   │   │   │   │        │   │   └───── ORDER_PLACE
           │   │   │   │   │   │        │   └───────── REVIEW_CREATE
           │   │   │   │   │   │        └───────────── MESSAGE_SEND
           │   │   │   │   │   └────────────────────── USERS_READ
           │   │   │   │   └────────────────────────── USERS_SUSPEND
           │   │   │   └────────────────────────────── USERS_MANAGE_PERMISSIONS
           │   │   └────────────────────────────────── LISTINGS_MODERATE
           │   └────────────────────────────────────── ORDERS_READ_ALL
           └────────────────────────────────────────── REVIEWS_MODERATE

user       0   0   0   0   0   0        1   1   1   1   = 15
moderator  1   1   1   0   1   1        1   1   1   1   = 3866639
admin      1   1   1   1   1   1        1   1   1   1   = 4128783
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

**Rôles = presets.** Un rôle n'est qu'un raccourci pour remplir le masque (`PATCH /admin/users/:id/role`). On peut ensuite ajuster bit par bit (`PATCH .../permissions`) : retirer `LISTING_SELL` à un vendeur douteux sans le suspendre, **retirer `MESSAGE_SEND` à un spammeur** (il lit encore ses messages mais n'en envoie plus), donner `ORDERS_READ_ALL` à quelqu'un du support sans en faire un moderator. Le profil renvoie `role` quand le masque correspond exactement à un preset, `null` sinon.

**Règles métier** (dans l'entité `User`, en opérations de bits) :

- **Changer des permissions** : il faut `USERS_MANAGE_PERMISSIONS`, jamais sur son propre compte, et **on ne touche qu'aux bits qu'on possède** : `bitsModifiés = avant XOR après`, refusé si `!hasAll(masqueActeur, bitsModifiés)`. Quelqu'un qui gère les droits sans être modérateur ne peut donc pas fabriquer un admin.
- **Suspendre / réactiver** : il faut `USERS_SUSPEND`, jamais soi-même, et la cible doit avoir **strictement moins de permissions** : `isStrictSubset(cible, acteur)`. Un moderator ne suspend ni un autre moderator (masques égaux) ni quelqu'un qui a un droit qu'il n'a pas.
- **Acheteur et vendeur ne sont pas des permissions** : `LISTING_SELL` dit si on *peut* vendre, mais « est-ce *mon* annonce ? » reste une relation vérifiée par chaque contexte (`listing.isOwnedBy`, `order.isVisibleTo`).
- **Premier admin** : les emails listés dans `ADMIN_EMAILS` (`.env`) reçoivent toutes les permissions **une fois l'email vérifié**, puis à chaque démarrage (y compris les permissions ajoutées au catalogue depuis). Un admin rétrogradé via l'API mais encore dans `ADMIN_EMAILS` redevient admin au prochain démarrage : le `.env` fait foi.
- **Routes de back-office sous `/admin/...`**, chacune dans le contexte qui possède la donnée (`/admin/users` dans identity, `/admin/listings` dans catalog, `/admin/orders` dans ordering, `/admin/reviews` dans reviews).

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
                                                                               ▲
messaging ──────────────────────ListingQueries─────────────────────────────────┘
   └──────────── tous : JwtAuthGuard, RequirePermission, CurrentUserId, UserQueries ────────────────► identity
```

Toujours via la `public-api` du contexte appelé. `notifications` n'apparaît pas ici : personne ne l'appelle, il écoute les événements (voir [Événements](#événements)). `media` non plus : il renvoie une URL que le client met dans son annonce. `ListingReservations` (reserve / release / markSold / withdraw) est la **seule** façon de changer le statut d'une annonce depuis un autre contexte ; les règles de transition restent dans l'entité `Listing`.

### Cycles de vie

```
Annonce   draft ──publish──► published ──checkout──► reserved ──livraison confirmée──► sold
            ▲                     ▲                       │
            │                     └──commande annulée─────┘
            └── vendeur suspendu ── published | reserved
          draft | published ──DELETE──► archived

Commande  pending_payment ──pay──► paid ──ship──► shipped ──confirm-delivery──► delivered
              │                     │                │
              │ 48 h sans paiement  │                └── 14 jours sans confirmation : confirmée d'office (job)
              ▼ (job : expirée)     │
          pending_payment | paid ──cancel──► cancelled   (annonces remises en vente)
                                   (ou compte suspendu : annulée d'office)
```

### Tâches planifiées

Déclenchées par l'horloge (`@nestjs/schedule`), dans la slice du contexte concerné (`features/<nom>/<nom>.job.ts`). Une commande en échec est loggée et n'empêche pas de traiter les suivantes.

| Job | Contexte | Fréquence | Effet |
|---|---|---|---|
| `ExpireUnpaidOrdersJob` | ordering | 10 min | Commande non payée sous 48 h → annulée, vélos remis en vente, `OrderExpired` |
| `AutoConfirmDeliveryJob` | ordering | 1 h | Expédiée depuis 14 jours → livrée, annonces vendues, `OrderDelivered` (`automatic: true`) |
| `PurgeExpiredAuthDataJob` | identity | 3 h du matin | Supprime sessions fermées et jetons expirés depuis plus de 7 jours |

### Routes

| Contexte | Méthode | Route | Accès |
|---|---|---|---|
| catalog | GET | `/listings` | public. Filtres : `q`, `category`, `brand`, `frameSize`, `wheelSize`, `condition`, `minPriceCents`, `maxPriceCents`, `sort` (`recent`, `price_asc`, `price_desc`), `page`, `limit` (≤ 50) |
| catalog | GET | `/listings/:id` | public (brouillons et archivées : 404), avec `favoritesCount` |
| catalog | POST | `/listings` | `LISTING_SELL`, crée un brouillon |
| catalog | PATCH | `/listings/:id` | `LISTING_SELL` + vendeur, si `draft` ou `published` |
| catalog | POST | `/listings/:id/publish` | `LISTING_SELL` + vendeur, exige description + 1 photo |
| catalog | DELETE | `/listings/:id` | vendeur, archive (`data: null`) |
| catalog | GET | `/me/listings` | connecté, tous statuts. Filtre `status`, paginé |
| catalog | PUT | `/listings/:id/favorite` | connecté, idempotent. Pas sa propre annonce, pas une vendue |
| catalog | DELETE | `/listings/:id/favorite` | connecté, idempotent |
| catalog | GET | `/me/favorites` | connecté, paginé, avec `available` (encore achetable ?) |
| media | POST | `/uploads/photos` | `LISTING_SELL`, multipart `file` (JPEG, PNG, WebP, ≤ 5 Mo) → `{ url }` à mettre dans `photoUrls` |
| ordering | GET | `/cart` | connecté, prix relus, annonces indisponibles signalées |
| ordering | POST | `/cart/items` | `ORDER_PLACE`, `{ listingId }` (`data: null`) |
| ordering | DELETE | `/cart/items/:listingId` | connecté (`data: null`) |
| ordering | POST | `/checkout` | `ORDER_PLACE`, `{ shippingAddress }`, une commande par vendeur |
| ordering | GET | `/orders` | connecté, mes achats. Filtre `status`, paginé. `paymentDueAt` tant que non payée |
| ordering | GET | `/orders/:id` | acheteur ou vendeur |
| ordering | POST | `/orders/:id/pay` | acheteur (paiement simulé) |
| ordering | POST | `/orders/:id/ship` | vendeur, `{ trackingNumber }` |
| ordering | POST | `/orders/:id/confirm-delivery` | acheteur |
| ordering | POST | `/orders/:id/cancel` | acheteur ou vendeur, avant expédition |
| ordering | GET | `/me/sales` | connecté, mes ventes. Filtre `status` (`?status=paid` = à expédier), paginé |
| reviews | POST | `/reviews` | `REVIEW_CREATE` + acheteur d'une commande livrée, `{ orderId, rating, comment? }` |
| reviews | GET | `/sellers/:id/reviews` | public, paginé. `meta.stats` : nombre, moyenne et répartition 1 à 5 sur **tous** les avis |
| reviews | POST | `/reviews/:id/reply` | vendeur noté, une fois, `{ reply }` |
| messaging | POST | `/conversations` | `MESSAGE_SEND`, `{ listingId, message }` : contacter le vendeur (réutilise la conversation si elle existe) |
| messaging | GET | `/conversations` | connecté, paginé : aperçu du dernier message, `unreadCount`, `myRole` |
| messaging | GET | `/conversations/unread-count` | connecté : `{ unread }` pour le badge |
| messaging | GET | `/conversations/:id/messages` | participant, paginé (page 1 = les plus récents), marque comme lu |
| messaging | POST | `/conversations/:id/messages` | `MESSAGE_SEND` + participant, `{ body }` |
| catalog | DELETE | `/admin/listings/:id` | `LISTINGS_MODERATE`, archive l'annonce de n'importe quel vendeur (si `draft` ou `published`) |
| ordering | GET | `/admin/orders` | `ORDERS_READ_ALL`, toutes les commandes. Filtres : `status`, `buyerId`, `sellerId`, `page`, `limit` (≤ 50) |
| ordering | GET | `/admin/orders/:id` | `ORDERS_READ_ALL`, lecture seule |
| reviews | DELETE | `/admin/reviews/:id` | `REVIEWS_MODERATE` : retire un avis abusif (exclu de la moyenne, l'acheteur ne peut pas en reposter) |

### Points de conception

- **Ce qui n'appartient pas au user renvoie 404**, pas 403 : on ne révèle pas qu'une annonce ou commande existe. Le 403 est réservé au cas où l'on voit la commande mais sans le bon rôle (le vendeur qui essaie de payer), et aux routes protégées par `@RequirePermission` quand une permission manque. Les routes déjà engagées (payer, expédier, annuler, confirmer) ne demandent pas de permission : retirer `ORDER_PLACE` empêche de nouveaux achats, pas de terminer ceux en cours. La modération ne passe pas par les routes normales : un moderator qui appelle `GET /orders/:id` sur une commande qui n'est pas la sienne reçoit 404, il doit utiliser `GET /admin/orders/:id`.
- **Checkout tout ou rien** : les commandes sont validées avant de réserver ; si une seule annonce n'est plus disponible, rien n'est créé (409) ; si l'enregistrement des commandes échoue, les annonces sont libérées.
- **Deux acheteurs en même temps** : `TypeOrmListingRepository.saveAll` fait un `UPDATE ... WHERE status = <statut lu>`. Si le statut a changé entre-temps, la transaction est annulée et le second acheteur reçoit 409.
- **Titre et prix copiés dans `order_lines`** au checkout : modifier une annonce ensuite ne change pas la commande.
- **Pas de clé étrangère entre contextes** : `sellerId`, `listingId`, `orderId` sont de simples ids. Chaque contexte possède ses tables.
- **Suspension = plus de ventes en cours** : catalog repasse les annonces en ligne en brouillon, ordering annule les commandes pas encore expédiées. Quand c'est le vendeur qui est suspendu, ses vélos réservés sont **retirés** (`ListingReservations.withdraw`) et pas remis en vente : les deux listeners tournent en même temps sur le même événement, et un `release` remettrait en ligne ce que catalog vient de retirer.
- **Messagerie** : une conversation par couple (annonce, acheteur), garantie par un index unique ; deux « premier message » simultanés finissent dans la même conversation. Les messages d'une conversation ont des dates **strictement croissantes** (+1 ms si deux tombent dans la même milliseconde) et « lu » veut dire « lu jusqu'au dernier message » : l'ordre et le compteur de non-lus sont exacts.
- **Favoris** : clé primaire (user, annonce) et `INSERT OR IGNORE` : idempotent même en concurrence. Une baisse de prix d'une annonce en ligne publie `ListingPriceDropped` avec la liste des users qui la suivent.
- **Photos** : le format est lu dans les premiers octets du fichier, jamais dans l'extension ou le Content-Type (falsifiables). Nom de fichier aléatoire (UUID), écriture en `wx` (jamais d'écrasement). Le port `PhotoStorage` permet de passer à S3 / Cloudinary sans toucher au reste.

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
| `EmailVerificationRequested` | identity | inscription, changement d'email, renvoi | notifications : lien de vérification (à la nouvelle adresse) |
| `PasswordResetRequested` | identity | mot de passe oublié | notifications : lien de reset |
| `PasswordChanged` | identity | changement ou reset du mot de passe | notifications : alerte de sécurité |
| `UserSuspended` | identity | suspension | **catalog** : annonces retirées · **ordering** : commandes en cours annulées · notifications : prévient le user |
| `UserReactivated` | identity | réactivation | notifications : prévient le user |
| `ListingPriceDropped` | catalog | baisse de prix d'une annonce en ligne | notifications : alerte à ceux qui l'ont en favori |
| `OrderPlaced` | ordering | checkout (un par commande) | notifications : récap à payer (acheteur) |
| `OrderPaid` | ordering | paiement | notifications : acheteur + vendeur |
| `OrderShipped` | ordering | expédition | notifications : numéro de suivi (acheteur) |
| `OrderDelivered` | ordering | réception confirmée (ou d'office) | notifications : demande d'avis (acheteur) + vente terminée (vendeur) |
| `OrderCancelled` | ordering | annulation (par un user ou compte suspendu : `reason`) | notifications : prévient l'autre partie |
| `OrderExpired` | ordering | non payée sous 48 h (job) | notifications : acheteur + vendeur |
| `ReviewCreated` | reviews | nouvel avis | notifications : prévient le vendeur |
| `ReviewReplied` | reviews | réponse du vendeur | notifications : prévient l'acheteur |
| `MessageSent` | messaging | nouveau message | notifications : prévient le destinataire |

`UserSuspended` montre le découplage : identity ne sait pas que trois contextes réagissent. Ajouter une conséquence (masquer ses avis, fermer ses conversations...) = un listener de plus, sans toucher à identity.

**Secrets dans les événements** : `EmailVerificationRequested` et `PasswordResetRequested` transportent le jeton en clair (c'est le seul moyen de le mettre dans l'email). Ne jamais les logger ni les stocker.

### Règles

- **Nommé au passé** : un fait déjà arrivé (`OrderPaid`), jamais un ordre (`SendEmail`).
- **Publié après l'enregistrement en base**, jamais avant : on n'annonce pas un paiement qui n'a pas été sauvegardé.
- **Que des valeurs simples** (ids, montants, titres), jamais une entité. Les événements de commande transportent une photo de la commande (`orderId`, `buyerId`, `sellerId`, `totalCents`, `itemTitles`) pour que les listeners n'aient pas à la relire.
- **`publish` ne bloque pas** : la requête répond sans attendre les listeners. **Un listener qui plante** est loggé (`[EventBus]`) et n'affecte ni la requête ni les autres listeners.
- **Événement ou appel direct ?** Événement pour les effets secondaires (emails). Appel direct via la `public-api` quand on a besoin du résultat tout de suite : `ordering` réserve les annonces via `ListingReservations`, il ne publie pas un événement en espérant que `catalog` suive.

### Le contexte `notifications`

- `domain/mailer.ts` : port `Mailer.send({ to, subject, text })`.
- `infrastructure/smtp-mailer.ts` : envoi réel (nodemailer), choisi automatiquement dès que `SMTP_HOST` est défini (Brevo, Mailgun, Mailtrap...).
- `infrastructure/console-mailer.ts` : sans `SMTP_HOST`, n'envoie rien et affiche l'email dans le terminal du serveur (`[Mailer] À : ... | Objet : ...`). Pratique en dev : les liens de vérification et de reset s'y lisent.
- `common/user-notifier.ts` : retrouve l'email du destinataire via `UserQueries` (identity), puis envoie.
- Aucune route, rien d'exporté : il ne fait qu'écouter.

---

## Format des réponses

Toutes les réponses ont la même forme, et `code` vaut toujours le status HTTP.

**Succès** :

```json
{ "code": 200, "data": [ ... ], "meta": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 } }
```

- `data` : la ressource, la liste, ou `null` quand il n'y a rien à renvoyer (archiver, panier).
- `meta` : infos annexes aux données : la pagination de toutes les listes (`page`, `limit`, `total`, `totalPages`), plus les stats de notes pour `/sellers/:id/reviews`. `null` sinon.

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
   - `meta` = rempli seulement si le controller renvoie `withMeta(data, meta)` ou `withPage(page)` (`core/http/api-response.ts`). Toute liste paginée : la query étend `PaginationQuery`, le use case renvoie un `Page<T>`, le controller `return withPage(...)`.
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
| `invalid` | 400 | `VALIDATION_FAILED` (DTO), `USER_INVALID`, `CURRENT_PASSWORD_INCORRECT`, `RESET_TOKEN_INVALID`, `VERIFICATION_TOKEN_INVALID`, `PHOTO_INVALID`, `MESSAGE_INVALID`, `CANNOT_MESSAGE_YOURSELF`, `LISTING_INVALID`, `ORDER_INVALID`, `REVIEW_INVALID`, `CART_EMPTY`, `CANNOT_BUY_OWN_LISTING` |
| `unauthorized` | 401 | `TOKEN_MISSING`, `TOKEN_INVALID`, `INVALID_CREDENTIALS`, `REFRESH_TOKEN_INVALID` |
| `forbidden` | 403 | `ORDER_ACTION_FORBIDDEN`, `ACCOUNT_SUSPENDED`, `INSUFFICIENT_PERMISSIONS`, `USER_ACTION_FORBIDDEN`, `REVIEW_ACTION_FORBIDDEN` |
| `not_found` | 404 | `USER_NOT_FOUND`, `SESSION_NOT_FOUND`, `REVIEW_NOT_FOUND`, `CONVERSATION_NOT_FOUND`, `LISTING_NOT_FOUND`, `ORDER_NOT_FOUND` |
| `conflict` | 409 | `EMAIL_ALREADY_USED`, `LISTING_NOT_AVAILABLE`, `LISTING_INVALID_STATUS`, `LISTING_CONCURRENT_UPDATE`, `CART_LISTING_UNAVAILABLE`, `ORDER_INVALID_STATUS`, `REVIEW_ORDER_NOT_DELIVERED`, `REVIEW_ALREADY_EXISTS`, `REVIEW_ALREADY_REPLIED`, `USER_ALREADY_SUSPENDED`, `USER_NOT_SUSPENDED`, `EMAIL_ALREADY_VERIFIED`, `LISTING_NOT_FAVORITABLE`, `LISTING_NOT_OPEN_FOR_CONTACT` |

Les erreurs du DTO deviennent une `RequestValidationError` (`exceptionFactory` du `ValidationPipe` dans `main.ts`). Leurs messages sont ceux de class-validator, en anglais.

Erreurs levées par Nest lui-même : `errcode` = nom du status (`NOT_FOUND` pour une route inconnue, `BAD_REQUEST` pour un JSON mal formé ou un `:id` qui n'est pas un UUID, `TOO_MANY_REQUESTS` pour la limite de requêtes, `PAYLOAD_TOO_LARGE` pour une photo de plus de 5 Mo).

---

## Recettes

### Ajouter une slice

Exemple : `deactivate-user` dans `identity`.

1. Créer `features/deactivate-user/` avec `deactivate-user.use-case.ts`, `deactivate-user.controller.ts` (et un DTO si besoin).
2. Mettre la logique métier dans l'entité (`user.deactivate()`), pas dans le use case.
3. Dans le controller, renvoyer directement `this.useCase.execute(...)` : l'intercepteur emballe la réponse. `@HttpCode(HttpStatus.OK)` sur un POST qui ne crée rien. Pas de try/catch : les erreurs remontent seules jusqu'au filtre.
4. Déclarer le controller et le use case dans `identity.module.ts`.

### Réagir à un événement

Exemple réel : `ReviewCreated` (reviews) → email au vendeur (notifications).

1. Dans `reviews` : `public/events/review-events.ts` (`class ReviewCreated extends DomainEvent`), exporté dans `public-api.ts`, publié dans `CreateReviewUseCase` **après** `reviews.save()` : `this.events.publish(new ReviewCreated(...))`.
2. Dans `notifications` : `features/review-emails/review-emails.listener.ts`, qui s'abonne dans `onModuleInit` : `this.events.subscribe(ReviewCreated, (event) => this.created(event))`.
3. Déclarer le listener dans `providers` de `notifications.module.ts`.

### Ajouter une tâche planifiée

Exemple réel : `ExpireUnpaidOrdersJob` (ordering).

1. Créer `features/expire-unpaid-orders/expire-unpaid-orders.job.ts` : un `@Injectable()` avec une méthode `@Cron(CronExpression.EVERY_10_MINUTES) async run()`.
2. La règle (« expirée si non payée après 48 h ») va dans l'entité (`order.expire(now)`), comme pour un use case. Le job ne fait que sélectionner et orchestrer.
3. Entourer chaque élément d'un `try/catch` qui logge : un échec n'empêche pas de traiter les suivants (il n'y a pas de filtre d'exceptions hors HTTP).
4. Déclarer le job dans `providers` du module. `ScheduleModule.forRoot()` est déjà dans `app.module.ts`.

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
- **Repartir de zéro** : `npm run seed` (vide et remplit avec la démo), ou supprimer `db.sqlite` et relancer pour une base vide.
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
  - `@messaging` → `src/context/core-domain/messaging/public-api.ts`
  - `@notifications` → `src/context/supporting/notifications/public-api.ts`
  - `@media` → `src/context/supporting/media/public-api.ts`
- **Suffixes dans une slice** : `.controller.ts` (route), `.use-case.ts`, `.dto.ts` (body), `.query.ts` (query params), `.listener.ts` (déclenché par un événement), `.job.ts` (déclenché par l'horloge).
- **Swagger sans annotation** : le plugin `@nestjs/swagger` (`nest-cli.json`) lit les types TypeScript et les décorateurs class-validator des `.dto.ts` / `.query.ts`. Les routes sont rangées par premier segment d'URL (`core/http/swagger.ts`). Pas de `@ApiProperty` à écrire, sauf cas spécial (upload multipart).
- **Logs** : `Logger` de Nest, une instance nommée par classe (`new Logger("ExpireUnpaidOrders")`). Une ligne par requête HTTP (`[HTTP] POST /auth/login 401 12ms`), une ligne par action de fond (job, listener, modération). Jamais de mot de passe, token ou corps de requête.
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
| `npm run lint:archi` | Vérifie les règles de dépendance (`.dependency-cruiser.cjs`) |
| `npm run seed` | **Vide la base** et la remplit avec la démo (refusé en production) |

---

## Sécurité

| Menace | Protection | Où |
|---|---|---|
| Force brute sur le login, spam d'emails | 5 essais / min / IP sur les routes d'auth, 120 / min ailleurs | `core/http/rate-limit.ts`, `@StrictRateLimit()` |
| Deviner quels emails ont un compte | Même message **et même temps de réponse** au login, `forgot-password` répond toujours 200 | `LoginUseCase`, `ForgotPasswordUseCase` |
| Vol de la base | Mots de passe en scrypt, refresh tokens et liens email stockés en empreinte SHA-256 | `ScryptPasswordHasher`, `CryptoSecretTokens` |
| Vol d'un token | Access token de 15 min, sessions révocables, rotation + détection de rejeu du refresh token | `SessionIssuer`, `RefreshSessionUseCase` |
| Prise de compte | Changer de mot de passe exige l'ancien ; un reset ferme toutes les sessions ; alerte email | `ChangePasswordUseCase`, `ResetPasswordUseCase` |
| Devenir admin en s'inscrivant avec une adresse de `ADMIN_EMAILS` | Admin seulement après vérification de l'email | `User.grantBootstrapAdmin` |
| Escalade de privilèges | On ne donne que les bits qu'on a, on ne modère que plus faible que soi | `User.changePermissions`, `isStrictSubset` |
| Fichier malveillant déguisé en image | Format lu dans les octets, 5 Mo max, nom aléatoire, pas d'écrasement | `detectImageFormat`, `LocalDiskPhotoStorage` |
| En-têtes HTTP | `helmet` (nosniff, HSTS, frameguard...), CORS limité à `CORS_ORIGINS` en prod | `main.ts` |
| Secret JWT par défaut en prod | Le serveur refuse de démarrer | `core/config/env.ts` |
| Fuite d'infos techniques | 500 générique, détail seulement dans les logs | `ApiExceptionFilter` |
| IP falsifiée (`X-Forwarded-For`) | Ignorée sauf `TRUST_PROXY=true` (derrière un vrai proxy) | `main.ts` |

---

## Limites actuelles

- **`synchronize: true`** : pas de migrations. À remplacer par des migrations TypeORM avant une vraie mise en prod.
- **Configuration dans `.env`** (chargé par `src/core/config/env.ts` avec `process.loadEnvFile`, sans paquet). Modèle commenté dans `.env.example`. Sans `.env`, des valeurs par défaut de dev sont utilisées (sauf `JWT_SECRET`, obligatoire en production).
- **Paiement simulé** : `POST /orders/:id/pay` ne débite rien. Brancher Stripe = un port `PaymentGateway` dans ordering + un webhook qui appelle `order.pay()`.
- **Bus en mémoire** : si le serveur s'arrête entre l'enregistrement et l'exécution d'un listener, l'email (ou le retrait d'annonces) est perdu, et un listener en échec n'est pas relancé. La solution propre (« outbox » : enregistrer l'événement en base dans la même transaction, puis le traiter) n'est pas en place.
- **Pas de rattrapage entre appels directs** : `ordering` appelle `ListingReservations`. Si une étape échoue après une autre (ex : annonces marquées vendues mais commande non enregistrée), rien ne corrige automatiquement, sauf au checkout où les annonces sont libérées.
- **Une seule instance** : la limite de requêtes, le bus d'événements et les tâches planifiées vivent dans le process. Avec plusieurs instances, il faudrait Redis (throttler, bus) et un verrou pour que chaque job ne tourne qu'une fois.
- **Photos sur le disque local** : à passer sur S3 / Cloudinary en prod (un adapter `PhotoStorage`). Les photos d'une annonce supprimée ne sont pas effacées.
- **Nouvelle permission = masques à migrer** : le masque est enregistré par user, donc une permission ajoutée au catalogue (comme `MESSAGE_SEND`) n'arrive pas toute seule chez les users existants (seuls les comptes `ADMIN_EMAILS` la reçoivent au démarrage). Il faut une migration (`UPDATE users SET permissions = permissions | 8 WHERE ...`), ou `npm run seed` en dev.
- **Masques limités au bit 52** : le driver SQLite renvoie un `number`. Au-delà, activer `safeIntegers` de better-sqlite3.
- **Pas de durée maximale de session** : une session utilisée au moins une fois tous les 30 jours n'expire jamais.
- **Pas de suppression de compte** (RGPD) : elle toucherait tous les contextes (annonces, commandes en cours, avis, messages). À faire avec un événement `UserDeleted` et une anonymisation.
- **Pas d'historique de modération** : les actions sont loggées, mais pas enregistrées en base (qui, quand, pourquoi).
- **Un email par message** : pas de regroupement (« 3 nouveaux messages »), ni de préférences de notification.
- **Pas de tests automatisés dans le dépôt** : les parcours (auth, sessions, favoris, messagerie, suspension, tâches planifiées) ont été vérifiés avec de vraies requêtes HTTP sur la base de démo.
