# Template — Next.js · Turborepo · Clerk · Pulumi · Scaleway

Socle de départ pour un nouveau produit : authentification, base de données, stockage de fichiers
et déploiement sont déjà câblés. Il reste à écrire le métier.

## Démarrer un projet

```bash
# 1. « Use this template » sur GitHub, puis :
pnpm run setup mon-projet # renomme tout, crée apps/web/.env, puis s'efface
# 2. Renseigner les clés Clerk dans apps/web/.env
pnpm install
pnpm infra:up             # PostgreSQL 17 + MinIO (bucket privé versionné)
pnpm db:migrate
pnpm db:seed
pnpm dev                  # http://localhost:3000
```

Prérequis : Node 24 (`.nvmrc`), pnpm 11.8 (`corepack enable`), Docker, un compte
[Clerk](https://dashboard.clerk.com). Pour déployer : un compte
[Scaleway](https://console.scaleway.com) et la CLI [Pulumi](https://www.pulumi.com/docs/install/).

## Ce qu'il y a dedans

| | |
| --- | --- |
| Monorepo | Turborepo, pnpm workspaces, TypeScript 6 en ESM partout |
| Application | Next.js 16 App Router, React 19, Server Components et Server Actions |
| Style | Tailwind CSS v4, design system maison dans `packages/ui` |
| Authentification | Clerk, middleware de protection des routes |
| Données | PostgreSQL 17, Drizzle ORM, migrations versionnées |
| Fichiers | S3 (MinIO en local, Scaleway Object Storage en ligne), bucket privé, URL signées |
| PWA | Manifeste, service worker versionné, mise à jour différée |
| Déploiement | Pulumi vers Scaleway Serverless Containers (`docs/DEPLOY.md`) |

Pas de bibliothèque de validation de schéma, pas de state manager, pas de client HTTP : les
Server Components et les Server Actions suffisent, et la validation des `FormData` est écrite
à la main dans `server/validation/`.

## Commandes

| Commande | Effet |
| --- | --- |
| `pnpm dev` | Lance l'application |
| `pnpm build` | Build de production |
| `pnpm lint` / `pnpm typecheck` | ESLint et `tsc --noEmit` sur tout le monorepo |
| `pnpm db:generate` | Génère une migration depuis le schéma Drizzle |
| `pnpm db:migrate` / `pnpm db:seed` | Applique les migrations / charge le jeu de démonstration |
| `pnpm db:studio` | Ouvre Drizzle Studio |
| `pnpm infra:up` / `infra:down` | Démarre / arrête PostgreSQL et MinIO en local |
| `pnpm deploy` | Construit l'image, la pousse, migre le schéma, met le stack Pulumi à jour |

## Structure

```
apps/web/            Next.js — pages RSC, Server Actions, services
packages/shared/     ActionState, erreurs, helpers purs (aucune dépendance)
packages/db/         Schéma Drizzle, client, migrations, seed
packages/ui/         Design system générique (theme.css + composants), sans métier
packages/storage/    Client S3, convention de clés, URL présignées
packages/config/     Configurations ESLint et TypeScript partagées
infra/               Pulumi — Scaleway Serverless Containers, PostgreSQL, Object Storage
```

## Verticale de démonstration

Une fonctionnalité « notes » complète est livrée pour montrer le chemin
`page RSC → Server Action → service → Drizzle`, ainsi que l'envoi de fichier direct
navigateur → bucket. Copiez-la pour votre premier écran, puis suivez `docs/REMOVE-DEMO.md`
pour la retirer.

Les règles de contribution et les invariants à ne pas casser sont dans `AGENTS.md`.
