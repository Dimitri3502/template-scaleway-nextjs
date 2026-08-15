# Retirer la verticale de démonstration

La fonctionnalité « notes » n'existe que pour montrer le chemin complet
`page RSC → Server Action → service → Drizzle` et l'envoi de fichier direct navigateur → bucket.
Le socle (authentification, i18n, design system, stockage, déploiement) n'en dépend pas.

Le plus simple est de **la copier pour votre premier écran** plutôt que de la supprimer d'abord.
Quand vous n'en avez plus besoin :

## 1. Supprimer les fichiers

```bash
rm -rf apps/web/app/app/notes \
       apps/web/components/notes \
       apps/web/server/actions/notes.ts \
       apps/web/server/services/notes.ts \
       apps/web/server/services/attachments.ts \
       apps/web/app/api/attachments \
       apps/web/messages/fr/notes.ts \
       apps/web/lib/notes-constraints.ts \
       packages/db/src/schema/notes.ts \
       packages/db/src/schema/attachments.ts
```

## 2. Nettoyer les fichiers qui les référencent

| Fichier | Ce qu'il faut retirer |
| --- | --- |
| `apps/web/messages/fr.ts` | l'import et le spread de `notes` |
| `apps/web/routes.ts` | `note()` et le bloc `api` |
| `apps/web/app/app/page.tsx` | à remplacer par votre propre écran |
| `apps/web/server/auth/audit.ts` | les événements `note.*` et `attachment.*` de `AuditEvent`, les champs `noteId` / `attachmentId` de `AuditContext` |
| `packages/db/src/schema.ts` | les exports `./schema/notes` et `./schema/attachments` |
| `packages/db/src/schema/relations.ts` | tout sauf ce qui concerne `users` |
| `packages/db/src/seed.ts` | l'insertion des notes |

Si vous ne gardez aucun envoi de fichier, vous pouvez aussi retirer `packages/storage`, ses
entrées dans `transpilePackages` (`apps/web/next.config.ts`) et dans `tsconfig.base.json`, les
erreurs d'upload de `packages/shared/src/errors.ts`, `packages/shared/src/upload/`, ainsi que le
service MinIO du `docker-compose.yml` et le bloc `object.Bucket` / IAM de `infra/src/storage.ts`.

## 3. Repartir sur des migrations propres

Tant que rien n'est en production, le plus net est de regénérer la migration initiale :

```bash
rm -rf packages/db/migrations
pnpm db:generate
pnpm infra:down && pnpm infra:up   # repart d'un volume vide
pnpm db:migrate
```

## 4. Vérifier

```bash
pnpm lint && pnpm typecheck
```

`MessageKey` étant typée, toute clé i18n restée orpheline fera échouer le `typecheck` — c'est le
filet qui garantit qu'il ne reste rien de la démonstration.
