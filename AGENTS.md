# Guide de contribution

## Stack

Turborepo · pnpm 11 · Node 24 · TypeScript 6 (ESM partout) · Next.js 16 App Router · React 19 ·
Tailwind CSS v4 · Base UI · Clerk · Drizzle ORM sur PostgreSQL 17 · S3 (`@aws-sdk/client-s3`) ·
Pulumi sur Scaleway.

Pas de bibliothèque de validation de schéma (pas de Zod) : la validation des `FormData` est écrite
à la main. Pas de state manager, pas de client HTTP : Server Components et Server Actions suffisent.

## Structure

```
apps/web/
  app/                 pages RSC et route handlers
  components/          composants de l'application
  server/actions/      "use server" — valide le FormData, appelle un service, revalide
  server/services/     import "server-only" — logique métier et requêtes Drizzle
  server/auth/         contexte d'accès, colonnes et événements d'audit
  server/validation/   lecture typée des FormData
  lib/                 helpers client purs
  i18n.ts, messages/   dictionnaire à clés typées
  routes.ts            toutes les URL
  proxy.ts             middleware Clerk
packages/shared|db|ui|storage|config/
infra/                 Pulumi
```

## Contrat d'architecture (non négociable)

```
app/ (pages RSC)     → server/services/*  → packages/db
app/ (formulaires)   → server/actions/*   → server/services/*
```

| Couche | Règle |
| --- | --- |
| `app/` | rend l'UI, n'accède **jamais** à la base, n'appelle jamais une action directement |
| `server/actions/` | valide, appelle un service, `revalidatePath`, renvoie un `ActionState` — **aucune requête Drizzle** |
| `server/services/` | `import "server-only"` en première ligne, logique et requêtes Drizzle |

Server Components par défaut ; `"use client"` réservé à l'interactivité réelle.

`runAction()` enveloppe **toutes** les actions : `unstable_rethrow` en premier dans le `catch`,
puis `FieldValidationError` → erreur de champ, puis table de correspondance de `server/errors.ts`.

Un module `"use server"` ne peut exporter que des fonctions asynchrones : les constantes
partagées avec le client vivent dans `lib/`, jamais dans le fichier d'actions.

## Modèle de données

PK `uuid` `defaultRandom()`, colonnes SQL en `snake_case`, `auditColumns()` sur toutes les tables.
Les `pgEnum` se construisent sur les constantes de `packages/shared` — le schéma ne redéfinit
jamais une énumération.

Une migration se **génère** (`pnpm db:generate`) ; une migration appliquée ne se modifie jamais.

## Invariants à ne pas casser

1. **Chaque requête métier porte le prédicat d'appartenance** (`owner_id = moi`), y compris les
   écritures et les suppressions. Une requête qui l'oublie expose les données d'autrui — c'est le
   point de vigilance principal de toute application multi-utilisateurs.
2. **Aucune valeur dérivée n'est persistée.** Ce qui se déduit se calcule ; sinon un état périmé
   devient possible et il faut une tâche de fond pour le rattraper.
3. **Le client ne choisit jamais une clé S3 ni un identifiant de pièce jointe.** Le serveur les
   génère, puis les recalcule et les compare à la confirmation.
4. **Les logs ne contiennent jamais de contenu.** `recordAuditEvent()` n'accepte que des
   identifiants. Jamais une donnée utilisateur, jamais une URL signée.
5. **Aucune couleur brute hors de `packages/ui/src/theme.css`**, aucune URL hors de `routes.ts`,
   aucun libellé utilisateur hors du dictionnaire i18n.
6. **Les variables `NEXT_PUBLIC_*` sont inlinées au build**, pas lues à l'exécution : elles
   passent en build args Docker, jamais en variables d'environnement du conteneur.

## i18n

`getTranslations()` est synchrone et pure : elle s'appelle depuis un Server Component comme depuis
un composant client. **`t` ne transite jamais en props** — chaque composant l'appelle localement.
`MessageKey` est typée : une clé inconnue ne compile pas. Interpolation par `{nom}`.

## Guidelines

- Code applicatif en anglais ; documentation, commits et libellés utilisateur en français.
- Un composant par fichier, une seule responsabilité. ~100 lignes par fichier, ~30 par fonction.
- Pas de `any`, `import type` imposé par ESLint, `eqeqeq`, `no-console` sauf `warn`/`error`.
- Early return plutôt que branches imbriquées ; on factorise à la 3ᵉ répétition, pas avant.
- Commentaires rares, en français, réservés au **pourquoi** d'une décision non évidente.

Après chaque étape : `pnpm lint` et `pnpm typecheck` doivent passer.
