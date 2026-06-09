# Yourazz License Manager

Bot Discord de gestion automatisée de licences vendeur avec paiement Stripe.

## Installation

```bash
# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.example .env
# Remplir les variables dans .env

# Générer le client Prisma
npm run db:generate

# Appliquer le schema à la base de données
npm run db:push

# Déployer les slash commands Discord
npm run deploy

# Lancer en développement
npm run dev

# Build production
npm run build
npm start
```

## Stack

- **Runtime** : Node.js + TypeScript strict
- **Bot** : Discord.js v14
- **Base de données** : PostgreSQL + Prisma ORM
- **Paiements** : Stripe Checkout + Webhooks
- **Validation** : Zod
- **Jobs** : Cron (expiration, rappels)
- **IA** : OpenAI (optionnel)

## Commandes Discord

### Vendeur
| Commande | Description |
|----------|-------------|
| `/licence acheter` | Voir les offres et payer |
| `/licence statut` | Statut de votre licence |
| `/licence renouveler` | Renouveler votre licence |
| `/licence dashboard` | Tableau de bord |
| `/licence key` | Activer une clé |
| `/licence aide` | Aide |
| `/key redeem <clé>` | Activer une clé licence |
| `/key status <clé>` | Vérifier une clé |

### Admin
| Commande | Description |
|----------|-------------|
| `/admin stats` | Statistiques |
| `/admin licences` | Lister les licences |
| `/admin licence voir` | Voir licence d'un user |
| `/admin licence donner` | Donner une licence |
| `/admin licence suspendre` | Suspendre |
| `/admin licence reactiver` | Réactiver |
| `/admin licence prolonger` | Prolonger |
| `/admin sync` | Sync rôles |
| `/admin logs` | Derniers événements |
| `/admin genkey` | Générer des clés |
| `/ia rapport` | Rapport IA |

## Webhook Stripe

Le bot expose un endpoint webhook sur `/webhook/stripe`.

Pour le développement local, utiliser Stripe CLI :
```bash
stripe listen --forward-to localhost:3000/webhook/stripe
```

## Plans

| Plan | Prix | Produits | Durée |
|------|------|----------|-------|
| Basic | 9.99€ | 1 | 30j |
| Pro | 24.99€ | 10 | 30j |
| Elite | 49.99€ | Illimité | 30j |

## Checklist déploiement

- [ ] Variables .env configurées
- [ ] Base PostgreSQL accessible
- [ ] Prisma schema appliqué (`npm run db:push`)
- [ ] Commandes déployées (`npm run deploy`)
- [ ] Webhook Stripe configuré dans le dashboard Stripe
- [ ] Rôles Discord créés et IDs dans .env
- [ ] Channels logs créés et IDs dans .env
- [ ] Bot invité avec permissions (Manage Roles, Send Messages)
- [ ] Test paiement en mode Stripe test
- [ ] IA configurée (optionnel)
