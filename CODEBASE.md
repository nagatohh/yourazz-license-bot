# Yourazz License Bot — Documentation complète

> **Stack :** TypeScript · Node.js · Discord.js v14 · Prisma · PostgreSQL (Supabase) · Stripe · Express · PM2
> **UI Discord :** Components V2 (ContainerBuilder, SectionBuilder, MediaGallery)

---

## Sommaire

1. [Structure du projet](#1-structure-du-projet)
2. [Variables d'environnement](#2-variables-denvironnement)
3. [Base de données — Schéma Prisma](#3-base-de-données--schéma-prisma)
4. [Configuration](#4-configuration)
5. [Entrée du bot](#5-entrée-du-bot)
6. [Événements](#6-événements)
7. [Commandes slash](#7-commandes-slash)
8. [Interactions](#8-interactions)
9. [Modules métier](#9-modules-métier)
10. [Services utilitaires](#10-services-utilitaires)
11. [Utilitaires](#11-utilitaires)
12. [Internationalisation](#12-internationalisation)
13. [Webhook Express](#13-webhook-express)
14. [Sécurité](#14-sécurité)
15. [Déploiement & PM2](#15-déploiement--pm2)
16. [Flux complets](#16-flux-complets)

---

## 1. Structure du projet

```
yourazz-license-bot/
├── src/
│   ├── index.ts                        # Point d'entrée
│   ├── deploy-commands.ts              # Déploiement des slash commands
│   ├── setup-guild.ts                  # Setup initial du serveur
│   │
│   ├── config/
│   │   ├── bot.ts                      # Validation .env via Zod
│   │   ├── branding.ts                 # URLs GIFs, couleurs, textes branding
│   │   ├── channels.ts                 # IDs des salons Discord
│   │   ├── licenses.ts                 # Définition des plans (prix, durée, features)
│   │   ├── roles.ts                    # IDs des rôles Discord
│   │   └── stripe.ts                   # Instance Stripe
│   │
│   ├── events/
│   │   ├── ready.ts                    # Événement bot connecté
│   │   └── interaction.ts              # Router central de toutes les interactions + rate limit
│   │
│   ├── commands/
│   │   ├── panel.ts                    # /license-panel (admin)
│   │   ├── licence.ts                  # /licence acheter|statut|renouveler|dashboard|key|aide
│   │   ├── key.ts                      # /key redeem|status
│   │   ├── admin.ts                    # /admin licence voir|donner|suspendre|reactiver|prolonger|stats|licences|sync|logs|genkey
│   │   └── ia.ts                       # /ia rapport (admin)
│   │
│   ├── interactions/
│   │   ├── panel-buttons.ts            # Boutons du panel (paiement, dashboard, langue, aide, support)
│   │   ├── buttons.ts                  # Boutons génériques (renouveler, redeem key)
│   │   ├── confirm-payment.ts          # Bouton confirmation de paiement Stripe
│   │   ├── modals.ts                   # Modal saisie clé licence
│   │   ├── lang-select.ts              # Select menu changement de langue
│   │   └── plan-select.ts              # Select menu choix de plan
│   │
│   ├── modules/
│   │   ├── licenses/
│   │   │   ├── license.service.ts      # CRUD licences (create, renew, suspend, expire, extend, stats)
│   │   │   ├── key.service.ts          # Génération et activation de clés YRZ-XXXX
│   │   │   └── expiration.job.ts       # Cron job toutes les 30min (rappels + expiration)
│   │   ├── payments/
│   │   │   ├── stripe.service.ts       # Création session Stripe, vérification webhook
│   │   │   ├── payment.service.ts      # Traitement paiement complété/échoué/remboursé
│   │   │   └── stripe-poller.ts        # Polling Stripe toutes les 15s (fallback webhook)
│   │   ├── notifications/
│   │   │   ├── notification.service.ts # DMs (activation, rappels, expiration) + logs salons
│   │   │   └── animation.service.ts    # Animation 4 étapes en DM à l'activation
│   │   ├── admin/
│   │   │   ├── role.service.ts         # Attribution/retrait des rôles Discord
│   │   │   └── audit.service.ts        # Logs d'audit en base
│   │   ├── users/
│   │   │   └── user.service.ts         # Upsert utilisateur Discord en base
│   │   └── ai/
│   │       └── ai.service.ts           # Analyse IA (OpenAI optionnel)
│   │
│   ├── services/
│   │   └── database.ts                 # Instance PrismaClient singleton
│   │
│   ├── utils/
│   │   ├── cv2.ts                      # Builders Components V2 (card, mediaGif, buildReply…)
│   │   ├── embeds.ts                   # Anciens helpers EmbedBuilder (legacy, non utilisé en prod)
│   │   ├── premium-embed.ts            # Helpers premium (progressBar, statusBadge, planBadge)
│   │   ├── format.ts                   # formatPrice, formatDate, daysUntil, generateLicenseKey
│   │   ├── logger.ts                   # Logger structuré
│   │   ├── permissions.ts              # isAdmin(), isSeller()
│   │   └── rateLimit.ts                # Cooldown par userId + command
│   │
│   ├── i18n/
│   │   ├── index.ts                    # t(), getUserLang(), setUserLang()
│   │   ├── fr.ts                       # Traductions françaises
│   │   ├── en.ts                       # Traductions anglaises
│   │   └── es.ts                       # Traductions espagnoles
│   │
│   └── webhook/
│       └── server.ts                   # Serveur Express (Stripe webhook + Helmet + rate limit)
│
├── prisma/
│   └── schema.prisma                   # Schéma base de données
│
├── .env                                # Variables secrètes (non committé)
├── .env.example                        # Template .env sans secrets
├── .gitignore                          # node_modules, dist, .env
├── ecosystem.config.js                 # Config PM2
├── package.json
└── tsconfig.json
```

---

## 2. Variables d'environnement

Fichier `.env` à la racine (jamais committé) :

```env
# Discord
DISCORD_TOKEN=             # Token du bot (Developer Portal → Reset Token)
DISCORD_CLIENT_ID=         # ID de l'application Discord
DISCORD_GUILD_ID=          # ID du serveur Discord

# Database
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/postgres

# Stripe
STRIPE_SECRET_KEY=sk_live_...       # Clé secrète Stripe (Restricted Key recommandée)
STRIPE_WEBHOOK_SECRET=whsec_...     # Secret de signature webhook Stripe

# App
APP_URL=https://yourazz.xyz         # URL de base pour les redirections Stripe
PORT=3001                            # Port du serveur webhook Express

# Discord Roles
ADMIN_ROLE_ID=             # ID du rôle administrateur
SELLER_BASIC_ROLE_ID=      # ID du rôle vendeur

# Discord Channels
STAFF_LOG_CHANNEL_ID=      # Salon logs staff (suspension, expiration, paiement échoué)
LICENSE_LOG_CHANNEL_ID=    # Salon logs nouvelles licences vendues

# AI (optionnel)
OPENAI_API_KEY=            # Clé OpenAI pour /ia rapport
```

Validation au démarrage via **Zod** dans `src/config/bot.ts` — le bot ne démarre pas si une variable obligatoire manque.

---

## 3. Base de données — Schéma Prisma

Schéma PostgreSQL dans le namespace `licenses` (Supabase).

### DiscordUser
| Champ | Type | Description |
|---|---|---|
| id | String (cuid) | PK interne |
| discordId | String unique | ID Discord de l'utilisateur |
| username | String | Nom d'utilisateur Discord |
| globalName | String? | Nom global (display name) |
| avatarUrl | String? | URL de l'avatar |
| language | String | Langue préférée (fr/en/es) défaut: fr |
| createdAt / updatedAt | DateTime | Timestamps |

### LicensePlan
| Champ | Type | Description |
|---|---|---|
| id | String (cuid) | PK |
| name | String unique | Identifiant du plan (ex: "vendeur") |
| displayName | String | Nom affiché |
| price | Int | Prix en centimes (2500 = 25,00€) |
| currency | String | Devise (EUR) |
| durationDays | Int | Durée en jours (30) |
| maxProducts | Int | -1 = illimité |
| roleId | String | ID du rôle Discord à attribuer |
| features | String[] | Liste des fonctionnalités |

> Le plan est créé/mis à jour automatiquement via `upsert` depuis `src/config/licenses.ts` à chaque création de licence.

### License
| Champ | Type | Description |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | FK → DiscordUser |
| guildId | String | ID du serveur Discord |
| planId | String | FK → LicensePlan |
| status | LicenseStatus | ACTIVE / EXPIRED / SUSPENDED / CANCELLED |
| startedAt | DateTime | Date de début |
| expiresAt | DateTime | Date d'expiration |
| renewedAt | DateTime? | Dernière date de renouvellement |
| suspendedAt | DateTime? | Date de suspension |
| suspensionReason | String? | Raison de la suspension |

### Payment
| Champ | Type | Description |
|---|---|---|
| id | String (cuid) | PK |
| userId | String | FK → DiscordUser |
| licenseId | String? | FK → License |
| stripeSessionId | String? unique | ID session Stripe Checkout |
| stripePaymentIntentId | String? unique | ID PaymentIntent Stripe |
| amount | Int | Montant en centimes |
| currency | String | Devise |
| status | PaymentStatus | PENDING / COMPLETED / FAILED / REFUNDED |
| plan | String | Nom du plan acheté |

### LicenseKey
| Champ | Type | Description |
|---|---|---|
| id | String (cuid) | PK |
| key | String unique | Clé au format YRZ-XXXX-XXXX-XXXX |
| planId | String | FK → LicensePlan |
| status | KeyStatus | AVAILABLE / REDEEMED / EXPIRED / BLACKLISTED |
| durationDays | Int | Durée accordée à l'activation |
| redeemedById | String? | FK → DiscordUser |
| redeemedAt | DateTime? | Date d'activation |

### AuditLog
| Champ | Type | Description |
|---|---|---|
| actorId | String? | Qui a fait l'action |
| action | String | Ex: LICENSE_GRANTED, LICENSE_EXPIRED, LICENSE_PURCHASED |
| targetId | String? | Sur qui porte l'action |
| metadata | Json? | Données supplémentaires |

### StripeWebhookEvent
Déduplique les événements Stripe (webhook + poller).
| Champ | Description |
|---|---|
| stripeEventId | ID unique de l'événement ou session Stripe |
| type | Type d'événement |
| processed | Boolean — true une fois traité |

---

## 4. Configuration

### `src/config/licenses.ts` — Plans

```typescript
export const PLANS: Record<string, PlanConfig> = {
  vendeur: {
    name: "vendeur",
    displayName: "Vendeur",
    emoji: "🏷️",
    price: 2500,          // centimes → 25,00€
    currency: "EUR",
    durationDays: 30,
    maxProducts: -1,       // illimité
    roleId: env.SELLER_BASIC_ROLE_ID,
    features: ["Accès vendeur complet", "Produits illimités", "Licence 30 jours", "Support prioritaire"],
    color: 0xdc2626,
  },
};

export const REMINDER_DAYS = [7, 3, 1]; // jours avant expiration pour envoyer un rappel
```

Pour ajouter un plan : ajouter une entrée dans `PLANS` et créer le rôle Discord correspondant.

### `src/config/branding.ts` — Assets visuels

```typescript
export const BRANDING = {
  logoUrl: "...",           // Logo Yourazz (thumbnail)
  bannerUrl: "...",         // GIF bannière principale
  successBannerUrl: "...",  // GIF confirmation paiement + DM bienvenue
  paymentBannerUrl: "...",  // GIF page paiement
  helpBannerUrl: "...",     // GIF aide
  dashboardBannerUrl: "...",// GIF dashboard
  footer: "Powered by Yourazz",
  websiteUrl: "https://yourazz.xyz",
};
```

---

## 5. Entrée du bot

### `src/index.ts`

1. Crée le `Client` Discord avec intent `Guilds`
2. Enregistre les handlers `onReady` et `onInteraction`
3. Connecte Prisma à PostgreSQL
4. Login avec `DISCORD_TOKEN`
5. Gère `unhandledRejection` et `SIGINT` (graceful shutdown)

---

## 6. Événements

### `src/events/ready.ts`
Déclenché une fois à la connexion du bot :
- Log du tag et du nombre de serveurs
- Définit l'activité `🏷️ /licence`
- Injecte le client dans le webhook server
- Lance `startWebhookServer()`
- Lance `startExpirationJob()`
- Lance `startStripePoller()`

### `src/events/interaction.ts` — Router central
Gère **toutes** les interactions Discord :

```
interactionCreate
├── isChatInputCommand → checkCooldown → commands.get(name).execute()
├── isStringSelectMenu
│   ├── yrz_plan_select → handlePlanSelect()
│   └── yrz_lang_select → handleLangSelect()
├── isButton → checkCooldown
│   ├── yrz_panel_* → handlePanelButton()
│   ├── yrz_confirm_payment_* → handleConfirmPayment()
│   └── yrz_* → handleButton()
└── isModalSubmit
    └── yrz_* → handleModal()
```

**Rate limiting** intégré : cooldown par `userId:command` avant toute exécution.

---

## 7. Commandes slash

### `/license-panel` — `src/commands/panel.ts`
- **Accès :** Admin uniquement (`setDefaultMemberPermissions(Administrator)`)
- **Action :** Envoie un panel public dans le salon courant avec 5 boutons
- **Boutons :** Paiement · Mon Dashboard · Langue · Aide · Support

---

### `/licence` — `src/commands/licence.ts`
- **Accès :** Vendeurs + Admins (`isSeller()`)

| Sous-commande | Description | Comportement |
|---|---|---|
| `acheter` | Acheter une licence | Crée une session Stripe Checkout, affiche lien de paiement |
| `statut` | Voir sa licence active | Affiche statut, expiration, barre de progression |
| `renouveler` | Renouveler | Crée une session Stripe, affiche le prix depuis la DB |
| `dashboard` | Tableau de bord | Historique des 5 dernières licences |
| `key` | Activer une clé | Affiche le bouton pour ouvrir le modal de saisie |
| `aide` | Aide | Explique le fonctionnement + liste les commandes |

---

### `/key` — `src/commands/key.ts`
- **Accès :** Vendeurs + Admins (`isSeller()`)

| Sous-commande | Description |
|---|---|
| `redeem <cle>` | Active une clé `YRZ-XXXX-XXXX-XXXX` — sanitisée avant traitement |
| `status <cle>` | Vérifie le statut d'une clé (AVAILABLE / REDEEMED / EXPIRED / BLACKLISTED) |

---

### `/admin` — `src/commands/admin.ts`
- **Accès :** Admin uniquement (`setDefaultMemberPermissions(Administrator)`)

| Groupe | Sous-commande | Description |
|---|---|---|
| `licence` | `voir <user>` | Affiche la licence active d'un utilisateur |
| `licence` | `donner <user> [duree]` | Crée une licence manuellement (défaut 30j) |
| `licence` | `suspendre <user> <raison>` | Suspend la licence + retire le rôle |
| `licence` | `reactiver <user>` | Réactive la dernière licence suspendue |
| `licence` | `prolonger <user> <jours>` | Ajoute N jours à la licence active |
| — | `stats` | Actives / Expirées / Suspendues / Revenus |
| — | `licences` | Liste les 15 dernières licences du serveur |
| — | `sync` | Resynchronise les rôles sur toutes les licences actives |
| — | `logs` | 10 derniers événements d'audit |
| — | `genkey [nombre]` | Génère N clés pour le plan vendeur |

---

### `/ia rapport` — `src/commands/ia.ts`
- **Accès :** Admin uniquement
- Analyse : licences actives/expirées/suspendues, revenus, alertes (expiration dans 3j / 7j), recommandations

---

## 8. Interactions

### `src/interactions/panel-buttons.ts`
Gère les boutons du panel public :

| customId | Action |
|---|---|
| `yrz_panel_payment` | Crée une session Stripe + affiche le GIF paiement |
| `yrz_panel_dashboard` | Affiche le dashboard vendeur avec barre de progression + GIF |
| `yrz_panel_language` | Affiche le select menu de langue |
| `yrz_panel_help` | Affiche le centre d'aide |
| `yrz_panel_support` | Affiche le message support + GIF |

### `src/interactions/confirm-payment.ts`
Bouton `yrz_confirm_payment_{sessionId}` :
1. Affiche "Vérification en cours..."
2. Récupère la session Stripe via l'API
3. Vérifie `payment_status === "paid"`
4. Vérifie l'idempotence (déjà traité ?)
5. Appelle `PaymentService.handleCheckoutCompleted()`
6. Affiche confirmation + GIF succès

### `src/interactions/buttons.ts`
| customId | Action |
|---|---|
| `yrz_renew` | Crée une session Stripe de renouvellement |
| `yrz_redeem_key` | Ouvre le modal de saisie de clé |

### `src/interactions/modals.ts`
| customId | Action |
|---|---|
| `yrz_redeem_modal` | Active la clé saisie (sanitisée), attribue le rôle |

### `src/interactions/lang-select.ts`
Met à jour la langue préférée de l'utilisateur en base.

### `src/interactions/plan-select.ts`
Crée une session Stripe pour le plan sélectionné dans le select menu.

---

## 9. Modules métier

### `LicenseService` — `src/modules/licenses/license.service.ts`

| Méthode | Description |
|---|---|
| `create(userId, guildId, planName, duration?)` | Crée une licence active |
| `renew(licenseId, duration?)` | Renouvelle en partant de la date d'expiration actuelle |
| `suspend(licenseId, reason)` | Passe en SUSPENDED |
| `reactivate(licenseId)` | Repasse en ACTIVE |
| `expire(licenseId)` | Passe en EXPIRED |
| `extend(licenseId, days)` | Ajoute N jours |
| `getActive(userId, guildId)` | Retourne la licence ACTIVE la plus récente |
| `getByUser(userId)` | Toutes les licences d'un user |
| `getExpiringIn(days)` | Licences expirant dans N jours |
| `getExpired()` | Licences ACTIVE dont `expiresAt < now` |
| `getAllByGuild(guildId, status?)` | Toutes les licences d'un serveur |
| `getStats(guildId)` | Compteurs + revenus total/mois |

> `getOrCreatePlan()` : upsert le plan en DB à chaque appel, ce qui maintient les prix synchronisés avec `config/licenses.ts`.

---

### `KeyService` — `src/modules/licenses/key.service.ts`

| Méthode | Description |
|---|---|
| `generate(planName, count)` | Génère N clés uniques au format `YRZ-XXXX-XXXX-XXXX` |
| `redeem(key, userId, guildId)` | Active une clé → crée une licence |
| `getStatus(key)` | Statut d'une clé |
| `blacklist(key)` | Blackliste une clé |

Format clé : `YRZ-` + 3 segments de 4 caractères alphanumériques (charset sans I, O, 0, 1 pour éviter la confusion).

---

### `ExpirationJob` — `src/modules/licenses/expiration.job.ts`
Cron **toutes les 30 minutes** :

1. **Rappels** : pour chaque valeur dans `REMINDER_DAYS` (7, 3, 1), envoie un DM aux vendeurs dont la licence expire exactement dans ce nombre de jours
2. **Expiration** : expire les licences ACTIVE dont `expiresAt < now`, retire le rôle, envoie un DM, log en base

---

### `StripeService` — `src/modules/payments/stripe.service.ts`

| Méthode | Description |
|---|---|
| `isConfigured()` | Vérifie si `STRIPE_SECRET_KEY` est défini |
| `createCheckoutSession(params)` | Crée une session Stripe Checkout en mode `payment` avec les metadata Discord |
| `verifyWebhookSignature(payload, sig)` | Vérifie la signature du webhook Stripe |

Les **metadata** envoyées à Stripe : `discordUserId`, `guildId`, `licensePlan`, `durationDays` — récupérées au retour webhook pour traiter le paiement.

---

### `PaymentService` — `src/modules/payments/payment.service.ts`

| Méthode | Description |
|---|---|
| `handleCheckoutCompleted(...)` | Crée ou renouvelle la licence, crée le paiement en DB, attribue le rôle, envoie l'animation DM, log |
| `handlePaymentFailed(...)` | Envoie un DM d'échec, log dans le salon staff |
| `handleRefund(...)` | Passe le paiement en REFUNDED, suspend la licence, retire le rôle |

**Idempotence** : vérifie `stripeSessionId` en DB avant tout traitement → un paiement ne peut être traité qu'une seule fois même si le webhook arrive plusieurs fois.

---

### `StripePoller` — `src/modules/payments/stripe-poller.ts`
Cron **toutes les 15 secondes** — fallback si le webhook Stripe n'arrive pas :
- Récupère les 10 dernières sessions `complete` de Stripe
- Pour chacune non encore traitée, appelle `PaymentService.handleCheckoutCompleted()`
- Même logique d'idempotence que le webhook

---

### `NotificationService` — `src/modules/notifications/notification.service.ts`

| Méthode | Type | Description |
|---|---|---|
| `sendLicenseActivated()` | DM | Licence activée avec date d'expiration |
| `sendExpirationReminder()` | DM | Rappel avec GIF, urgence selon les jours restants |
| `sendLicenseExpired()` | DM | Licence expirée |
| `sendPaymentFailed()` | DM | Paiement échoué |
| `logNewLicense()` | Salon | Log nouvelle vente dans `LICENSE_LOG_CHANNEL_ID` |
| `logLicenseExpired()` | Salon | Log expiration dans `STAFF_LOG_CHANNEL_ID` |
| `logPaymentFailed()` | Salon | Log paiement échoué dans `STAFF_LOG_CHANNEL_ID` |

---

### `AnimationService` — `src/modules/notifications/animation.service.ts`
Envoie une animation 4 étapes en DM à l'activation d'une licence :

```
Étape 1 (0s)    — 🟡 Vérification du paiement...
Étape 2 (+1.5s) — ✅ Paiement vérifié · 🟡 Activation de la licence...
Étape 3 (+3s)   — ✅ Paiement vérifié · ✅ Licence activée · 🟡 Attribution du rôle...
Étape 4 (+4.5s) — Message de bienvenue final + GIF succès + boutons Dashboard/Support
```

---

### `RoleService` — `src/modules/admin/role.service.ts`

| Méthode | Description |
|---|---|
| `assignSellerRole(client, guildId, userId, planName)` | Retire les autres rôles vendeur, ajoute le rôle du plan |
| `removeSellerRoles(client, guildId, userId)` | Retire tous les rôles de `ALL_SELLER_ROLES` |

---

### `AuditService` — `src/modules/admin/audit.service.ts`

| Action loggée | Déclencheur |
|---|---|
| `LICENSE_PURCHASED` | Paiement Stripe complété |
| `LICENSE_GRANTED` | `/admin licence donner` |
| `LICENSE_EXPIRED` | Cron expiration |

---

## 10. Services utilitaires

### `UserService` — `src/modules/users/user.service.ts`
- `getOrCreate(user)` : upsert en DB à chaque interaction (maintient username/avatar à jour)
- `getByDiscordId(id)` : récupère un utilisateur par son ID Discord

### `src/services/database.ts`
Instance singleton `PrismaClient` partagée dans tout le projet.

---

## 11. Utilitaires

### `src/utils/cv2.ts` — Components V2
Fonctions de construction de messages Discord V2 :

| Export | Description |
|---|---|
| `CV2_FLAG` | `32768` — flag `IsComponentsV2` obligatoire sur chaque message CV2 |
| `ACCENT` | Map des couleurs par type (success, error, warning, info, primary, dark) |
| `cv2Reply(options)` | Ajoute le flag CV2 à un payload de message |
| `sep(spacing?)` | Crée un `SeparatorBuilder` |
| `mediaGif(url)` | Crée un `MediaGalleryBuilder` avec une image/GIF |
| `card(accent, title, lines, opts?)` | Container complet avec titre, contenu, footer |
| `successCard(title, desc)` | Card verte ✅ |
| `errorCard(title, desc)` | Card rouge ❌ |
| `warningCard(title, desc)` | Card orange ⚠️ |
| `infoCard(title, desc)` | Card bleue ℹ️ |
| `primaryCard(title, lines, opts?)` | Card rouge Yourazz |
| `buildReply(containers, rows?)` | Assemble containers + ActionRows avec le flag CV2 |

> **Important :** Tous les messages qui utilisent Components V2 doivent passer par `buildReply()` — le flag `32768` est obligatoire sinon Discord retourne une erreur.

### `src/utils/permissions.ts`
```typescript
isAdmin(member)   // rôle ADMIN_ROLE_ID ou permission Administrator
isSeller(member)  // rôle SELLER_BASIC_ROLE_ID ou isAdmin()
```

### `src/utils/rateLimit.ts`
Cooldown en mémoire par `userId:command` :
- `licence acheter` / `renouveler` : 10s
- `key redeem` : 15s
- `statut` / `dashboard` / `aide` : 5s
- Boutons : 3s par défaut
- Auto-nettoyage mémoire au-delà de 500 entrées

### `src/utils/format.ts`
```typescript
formatPrice(cents, currency?)   // 2500, "EUR" → "25,00 €"
formatDate(date)                 // Date → "5 juin 2026 à 21:30"
daysUntil(date)                  // Jours restants (arrondi au supérieur)
generateLicenseKey()             // → "YRZ-A3B2-C4D5-E6F7"
```

### `src/utils/premium-embed.ts`
```typescript
progressBar(current, max, length?)  // "████░░░░░░ 40%"
statusBadge(status)                  // "🟢 Actif" / "🔴 Expiré" / etc.
planBadge()                          // "🔥 Vendeur Yourazz"
```

---

## 12. Internationalisation

3 langues supportées : **fr** (défaut), **en**, **es**.

La langue est stockée par utilisateur en base (`DiscordUser.language`).

```typescript
t(lang, "payment.title")     // → "🏷️ Licence Vendeur — Yourazz"
getUserLang(userId)           // Lit la langue depuis la DB
setUserLang(userId, lang)     // Met à jour la langue en DB
```

Pour ajouter une langue : créer `src/i18n/xx.ts` et l'importer dans `src/i18n/index.ts`.

---

## 13. Webhook Express

`src/webhook/server.ts` — port `3001` par défaut.

**Sécurité appliquée :**
- `helmet()` — headers HTTP sécurisés (XSS, clickjacking, MIME sniffing)
- `express-rate-limit` — max 30 req/min par IP
- `x-powered-by` désactivé
- Vérification signature Stripe sur chaque requête (`stripe.webhooks.constructEvent`)
- Idempotence via `StripeWebhookEvent` en DB

**Routes :**
| Route | Description |
|---|---|
| `POST /webhook/stripe` | Réception des événements Stripe |
| `GET /payment/success` | Page de redirection après paiement réussi |
| `GET /payment/cancel` | Page de redirection après annulation |
| `GET /health` | Health check `{"status":"ok"}` |

**Événements Stripe traités :**
| Événement | Action |
|---|---|
| `checkout.session.completed` | Active/renouvelle la licence |
| `checkout.session.expired` | Log uniquement |
| `payment_intent.payment_failed` | DM + log paiement échoué |
| `charge.refunded` | Suspend la licence + retire le rôle |

> Le bot dispose aussi d'un **poller Stripe** (toutes les 15s) comme fallback si le webhook n'arrive pas.

---

## 14. Sécurité

### Permissions Discord
| Commande | Accès |
|---|---|
| `/admin`, `/license-panel`, `/ia` | `setDefaultMemberPermissions(Administrator)` + check `isAdmin()` |
| `/licence`, `/key` | Check `isSeller()` (rôle vendeur ou admin) |

### Rate limiting
- Commandes Discord : cooldown par `userId:command` (3-15s selon la commande)
- Boutons : cooldown 3s par défaut
- Webhook HTTP : 30 req/min par IP

### Sanitisation des inputs
Les clés licence sont nettoyées avant traitement :
```typescript
key.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 19)
```

### Variables d'environnement
- Validées au démarrage via **Zod** (le bot ne démarre pas si une variable obligatoire est manquante)
- `.env` dans `.gitignore`
- `.env.example` fourni sans secrets

---

## 15. Déploiement & PM2

### Commandes
```bash
# Installation
npm install
npm run db:generate     # Génère le client Prisma
npm run db:push         # Applique le schéma en base
npm run deploy          # Déploie les slash commands Discord

# Production
npm run build           # Compile TypeScript → dist/
pm2 start ecosystem.config.js
pm2 save

# Gestion
pm2 list                              # État des processus
pm2 logs yourazz-license-bot          # Logs en direct
pm2 restart yourazz-license-bot --update-env  # Redémarre avec les nouvelles variables .env
pm2 stop yourazz-license-bot          # Arrêt
```

### `ecosystem.config.js`
```javascript
module.exports = {
  apps: [{
    name: "yourazz-license-bot",
    script: "dist/index.js",
    cwd: "C:/Users/KYLIAN/Desktop/yourazz-license-bot",
    restart_delay: 3000,
    max_restarts: 10,
    watch: false,
    env: { NODE_ENV: "production" },
  }],
};
```

### Démarrage automatique au boot Windows
Exécuter une fois en PowerShell administrateur :
```powershell
schtasks /create /tn "YourazzLicenseBot" /tr "C:\Users\KYLIAN\Desktop\yourazz-license-bot\start-bot.bat" /sc onlogon /ru "KYLIAN" /f
```

---

## 16. Flux complets

### Flux achat via panel

```
Utilisateur clique "Paiement" (yrz_panel_payment)
  → handlePayment() crée une session Stripe Checkout
  → Affiche le Container CV2 avec GIF + boutons [Payer] [Confirmer]
  → Utilisateur clique [Payer] → redirigé vers Stripe
  → Utilisateur paye sur Stripe
  → Utilisateur revient sur Discord et clique [Confirmer paiement]
  → handleConfirmPayment() récupère la session via API Stripe
  → session.payment_status === "paid" ✓
  → PaymentService.handleCheckoutCompleted()
    → LicenseService.create() ou .renew()
    → prisma.payment.create()
    → RoleService.assignSellerRole()
    → AnimationService.sendActivationAnimation() (DM 4 étapes)
    → NotificationService.logNewLicense() (salon log)
    → AuditService.log("LICENSE_PURCHASED")
  → Affiche confirmation + GIF succès
```

### Flux expiration automatique (cron 30min)

```
ExpirationJob.checkExpired()
  → LicenseService.getExpired() → licences ACTIVE avec expiresAt < now
  → Pour chaque licence :
    → LicenseService.expire()
    → RoleService.removeSellerRoles()
    → NotificationService.sendLicenseExpired() (DM)
    → NotificationService.logLicenseExpired() (salon staff)
    → AuditService.log("LICENSE_EXPIRED")

ExpirationJob.checkReminders()
  → Pour chaque valeur dans [7, 3, 1] :
    → LicenseService.getExpiringIn(days)
    → NotificationService.sendExpirationReminder() (DM + GIF)
```

### Flux activation clé manuelle

```
/key redeem YRZ-XXXX-XXXX-XXXX
  → Sanitisation input (strip caractères non valides)
  → KeyService.redeem()
    → Vérifie que la clé existe et est AVAILABLE
    → LicenseService.create()
    → prisma.licenseKey.update(status: REDEEMED)
  → RoleService.assignSellerRole()
  → Affiche successCard "Clé activée !"
```
