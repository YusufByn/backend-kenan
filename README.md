# Vélo Marketplace — API

API REST d'une marketplace de vélos d'occasion entre particuliers : on publie une annonce, on discute avec le vendeur, on achète, on suit la livraison, on laisse un avis.

**NestJS 12 · TypeScript · TypeORM + SQLite · Clean Architecture + DDD + Vertical Slices**

## Démarrer en 2 minutes

```bash
npm install
npm run seed      # crée la base et la remplit avec un jeu de démo
npm run dev       # http://localhost:3000
```

Ouvre **http://localhost:3000/docs** : toutes les routes sont documentées et testables (bouton **Authorize** pour coller un token).

Comptes de démo (mot de passe `password123`) :

| Email | Profil |
|---|---|
| `admin@velo.test` | admin, toutes les permissions |
| `modo@velo.test` | modérateur |
| `vendeur@velo.test` | Camille : annonces en ligne, un brouillon, des ventes à tous les stades, un avis avec réponse |
| `vendeur2@velo.test` | Lucas : annonces, une conversation avec un acheteur |
| `acheteur@velo.test` | Yanis : commandes, favoris, conversation |
| `acheteur2@velo.test` | Inès : commande à payer, commande expédiée |
| `nouveau@velo.test` | email pas encore vérifié |

Sans configuration, tout marche : les emails sont affichés dans le terminal du serveur (avec leurs liens de vérification et de reset). Pour la configuration (SMTP, CORS, secret JWT...), voir [`.env.example`](.env.example).

## Fonctionnalités

**Comptes et sécurité**
- Inscription, connexion, **sessions par appareil** (liste, déconnexion d'un appareil, de tous)
- Access token JWT de 15 min + **refresh token avec rotation** et détection de vol
- **Vérification d'email**, mot de passe oublié, changement de mot de passe (déconnecte les autres appareils)
- **Limite de tentatives** sur les routes sensibles, en-têtes de sécurité (helmet), temps de réponse constant au login

**Rôles et permissions**
- **Permissions en bitmask** (1 bit = 1 droit) : presets `user` / `moderator` / `admin`, ajustables bit par bit
- Modération : suspendre un compte (ses annonces sont retirées, ses commandes en cours annulées, il est prévenu), retirer une annonce ou un avis, rendre un user muet

**Marketplace**
- Annonces avec recherche multicritère (catégorie, taille, état, prix, tri), **upload de photos**
- **Favoris** avec **alerte email en cas de baisse de prix**
- **Messagerie** acheteur / vendeur par annonce, compteur de non-lus
- Panier multi-vendeurs, checkout (une commande par vendeur), paiement, expédition avec suivi, réception
- **Tâches planifiées** : commande non payée annulée après 48 h, livraison confirmée d'office après 14 jours
- **Avis** sur les vendeurs avec moyenne et répartition, **droit de réponse** du vendeur
- **Emails** à chaque étape (une quinzaine de types), en SMTP réel dès que `SMTP_HOST` est configuré

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | Serveur en watch mode |
| `npm run seed` | **Vide la base** et la remplit avec la démo |
| `npm run build` / `npm start` | Compiler / lancer la version compilée |
| `npm run typecheck` | Vérifier les types |

## Architecture

```
src/
├── context/
│   ├── core-domain/   catalog · ordering · reviews · messaging      ← le métier
│   ├── supporting/    notifications · media                         ← au service du métier
│   └── generic/       identity                                      ← comptes, auth, permissions
└── core/              technique pur : erreurs, événements, HTTP, pagination, bitmask
```

Chaque contexte est découpé en **slices** (une fonctionnalité = un dossier : controller, use case, DTO) autour d'un **domaine pur** (entités et ports, sans Nest ni TypeORM). Les contextes ne se parlent que par leur `public-api.ts` ou par **événements** (`UserSuspended` → catalog retire les annonces, ordering annule les commandes, notifications prévient le user, sans qu'identity les connaisse).

Toutes les réponses ont le même format : `{ code, data, meta }` en succès, `{ code, message, fields, errcode }` en erreur.

Tout est détaillé dans **[archi.md](archi.md)** : couches, règles de dépendance, auth, bitmask, événements, format des erreurs, sécurité, recettes pour ajouter une slice, un contexte ou une tâche planifiée, et limites connues.
