# Déploiement sur Scaleway

Cible : **Serverless Containers** pour l'application, **Managed Database** pour PostgreSQL,
**Object Storage** pour les fichiers, le tout décrit dans `infra/` avec Pulumi. Un seul stack
(`prod`), lancé depuis votre poste — il n'y a pas de CI.

## 1. Prérequis

- La CLI [Pulumi](https://www.pulumi.com/docs/install/) et un compte Pulumi (le backend gratuit
  suffit ; `pulumi login --local` fonctionne aussi).
- La CLI [scw](https://github.com/scaleway/scaleway-cli), configurée avec un profil.
- Docker en état de construire une image `linux/amd64`.

Les identifiants Scaleway viennent d'un profil `scw` — jamais de variables d'environnement.
La CLI en stocke autant que vous avez d'organisations, dans `~/.config/scw/config.yaml` :

```bash
scw init --profile mon-profil     # créer ; scw config profile list pour lister
```

Le stack désigne ensuite le profil à employer (étape suivante), et c'est ce profil-là qui fait
autorité — pas celui actif dans votre session. Avec plusieurs organisations sur la même
machine, il devient impossible de déployer dans la mauvaise : `pulumi up` et `pnpm deploy`
tirent leur identité du même endroit, et `pnpm deploy` efface les `SCW_*` traînant dans
l'environnement avant d'appeler Pulumi.

## 2. Créer le stack

```bash
cd infra
pnpm install
pulumi stack init prod

# Lie le stack à une organisation. Obligatoire : pnpm deploy s'arrête sans cette clé.
pulumi config set scaleway:profile mon-profil

pulumi config set clerkPublishableKey pk_live_xxxxxxxx
pulumi config set --secret clerkSecretKey sk_live_xxxxxxxx

# Autorise votre poste à joindre l'endpoint public de PostgreSQL (migrations, db:studio).
pulumi config set adminCidr "$(curl -s https://ifconfig.me)/32"
```

`pulumi config set --secret` chiffre la valeur : `Pulumi.prod.yaml` peut être versionné.

## 3. Amorçage — en deux temps

Le registre doit exister avant le premier `docker push`, et le conteneur ne peut pas démarrer
sans image. Le premier passage crée donc tout **sauf** le conteneur :

```bash
cd infra
pulumi preview     # vérifie la configuration sans rien créer
pulumi up
```

Puis le déploiement proprement dit, depuis la racine du dépôt :

```bash
pnpm deploy
```

`pnpm deploy` enchaîne : `docker login` sur le registre → `docker build` avec les build args →
`docker push` → `pulumi config set imageTag <sha>` → `pulumi up`. Le conteneur est créé à ce
moment-là, et `pulumi stack output appUrl` donne l'URL.

Les fois suivantes, `pnpm deploy` seul suffit.

## 4. Migrations

Elles se lancent depuis votre poste, contre l'endpoint public protégé par `adminCidr` :

```bash
cd infra && pulumi stack output databaseUrl --show-secrets --stack prod
# puis, à la racine :
DATABASE_URL='<la valeur ci-dessus>' pnpm db:migrate
```

C'est volontairement manuel : appliquer les migrations au démarrage du conteneur créerait une
course dès que plusieurs instances démarrent en même temps. Si vous voulez automatiser, la bonne
brique est un **Serverless Job** dédié, déclenché avant la mise à jour du conteneur.

## 5. Le piège des variables NEXT_PUBLIC_*

Next.js **inline** les variables `NEXT_PUBLIC_*` dans le bundle **au moment du build**. Les
déclarer comme variables d'environnement du conteneur Scaleway n'a donc aucun effet : le build
passe, l'application se déploie, et Clerk échoue côté navigateur avec une clé absente.

Dans ce template elles sont des `ARG` du `Dockerfile`, passés par `scripts/deploy.mjs` depuis la
configuration Pulumi. Si vous ajoutez une variable publique, ajoutez-la aux trois endroits :
`Dockerfile` (ARG + ENV de l'étage `builder`), `scripts/deploy.mjs` (`--build-arg`) et
`turbo.json` (`globalEnv`).

Les secrets, eux, sont bien des variables d'exécution : ils arrivent par
`secretEnvironmentVariables` dans `infra/src/app.ts`.

## 6. Ce que Pulumi crée

| Ressource | Fichier | Remarque |
| --- | --- | --- |
| Réseau privé régional | `src/network.ts` | Le conteneur joint PostgreSQL sans passer par Internet |
| Instance PostgreSQL 17 | `src/database.ts` | `DB-DEV-S` par défaut, sauvegardes quotidiennes 7 jours |
| ACL de la base | `src/database.ts` | Créée uniquement si `adminCidr` est défini |
| Bucket privé versionné | `src/storage.ts` | CORS ouvert pour l'envoi direct navigateur → bucket |
| Application IAM + clé API | `src/storage.ts` | Portée limitée aux objets du projet |
| Namespace de registre | `src/registry.ts` | Privé |
| Namespace + conteneur | `src/app.ts` | `minScale: 1`, `maxScale: 3`, port 8080 |

Sorties utiles : `appUrl`, `registryEndpoint`, `bucketName`, `databaseUrl` (secrète).

## 7. Coût indicatif

Avec les valeurs par défaut, comptez de l'ordre de **20 à 30 € par mois** : l'essentiel vient de
l'instance PostgreSQL `DB-DEV-S` et de `minScale: 1` sur le conteneur. Deux leviers :

- `pulumi config set minScale 0` — le conteneur ne coûte plus qu'à l'usage, au prix d'un
  démarrage à froid de quelques secondes sur la première requête.
- Un nœud de base plus petit ou mutualisé si le projet est un prototype.

Vérifiez les tarifs à jour sur [scaleway.com/fr/tarifs](https://www.scaleway.com/fr/tarifs/) :
cet ordre de grandeur n'engage rien.

## 8. Nom de domaine

Ajoutez dans `infra/src/app.ts` :

```ts
new scaleway.containers.Domain("app-domain", {
  containerId: container.id,
  hostname: "app.mondomaine.fr",
});
```

Le CNAME doit pointer vers `container.domainName` avant le `pulumi up`, sinon la validation du
certificat échoue.

## 9. Détruire

```bash
cd infra && pulumi destroy --stack prod
```

Le bucket refuse d'être détruit s'il contient encore des objets : videz-le, ou passez
`forceDestroy: true` sur la ressource `object.Bucket`.
