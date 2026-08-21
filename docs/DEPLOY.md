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
# Obligatoire : pnpm deploy applique les migrations depuis ce poste.
pulumi config set adminCidr "$(curl -4 -s https://ifconfig.me)/32"

# Facultatif — domaine custom et DNS, voir section 8.
pulumi config set appHostname app.mondomaine.fr
pulumi config set cloudflareZoneId 0123456789abcdef0123456789abcdef
pulumi config set --secret cloudflare:apiToken cf_xxxxxxxx
```

`pulumi config set --secret` chiffre la valeur : `Pulumi.prod.yaml` peut être versionné.

## 3. Amorçage — en deux temps

Le registre doit exister avant le premier envoi d'image, et le conteneur ne peut pas démarrer
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

`pnpm deploy` enchaîne : `docker login` sur le registre → `docker buildx build --push` avec les
build args → `pnpm db:migrate` → `pulumi config set imageTag <sha>` → `pulumi up`. Le conteneur
est créé à ce moment-là, et `pulumi stack output appUrl` donne l'URL.

Le build passe par un builder `docker-container` dédié (`deploy-scaleway`), créé au premier
déploiement : l'image part au registre depuis BuildKit, le magasin d'images local n'est jamais
sollicité.

Les fois suivantes, `pnpm deploy` seul suffit.

## 4. Migrations

`pnpm deploy` les applique lui-même : une fois l'image poussée, avant que `pulumi up` ne la mette
en service. Elles partent de votre poste, par l'endpoint public protégé par `adminCidr` — d'où
l'arrêt immédiat du déploiement si ce bloc n'est pas configuré.

Le schéma migre donc pendant que la version précédente sert encore le trafic : **une migration
doit rester compatible avec le code déjà en ligne**. Renommer ou supprimer une colonne, la passer
en `NOT NULL` sans valeur par défaut — cela se fait en deux déploiements.

`SKIP_MIGRATIONS=1 pnpm deploy` ne publie que l'image, sans toucher au schéma.

Hors déploiement, à la main :

```bash
cd infra && pulumi stack output databaseUrl --show-secrets --stack prod
# puis, à la racine :
DATABASE_URL='<la valeur ci-dessus>' pnpm db:migrate
```

Elles ne sont pas appliquées au démarrage du conteneur : ce serait une course dès que plusieurs
instances démarrent en même temps. Pour les sortir du poste de développement, la bonne brique est
un **Serverless Job** dédié, déclenché avant la mise à jour du conteneur.

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

Corollaire pour Clerk : **la clé publiable encode l'URL de la Frontend API**. Passer l'instance
sur un domaine custom la change. Il faut alors `pulumi config set clerkPublishableKey pk_live_…`
**puis un `pnpm deploy` complet** — un `pulumi up` seul laisserait l'ancienne clé inlinée dans
l'image.

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
| CNAME + domaine du conteneur | `src/dns.ts` | Seulement si `appHostname` et `cloudflareZoneId` sont définis |
| CNAME du domaine Clerk | `src/dns.ts` | Jamais proxifiés, pilotés par `clerkDnsRecords` |

Sorties utiles : `appUrl`, `containerUrl`, `registryEndpoint`, `bucketName`, `databaseUrl`
(secrète). `appUrl` renvoie le domaine custom dès qu'il est câblé, sinon l'endpoint Scaleway.

## 7. Coût indicatif

Avec les valeurs par défaut, comptez de l'ordre de **20 à 30 € par mois** : l'essentiel vient de
l'instance PostgreSQL `DB-DEV-S` et de `minScale: 1` sur le conteneur. Deux leviers :

- `pulumi config set minScale 0` — le conteneur ne coûte plus qu'à l'usage, au prix d'un
  démarrage à froid de quelques secondes sur la première requête.
- Un nœud de base plus petit ou mutualisé si le projet est un prototype.

Vérifiez les tarifs à jour sur [scaleway.com/fr/tarifs](https://www.scaleway.com/fr/tarifs/) :
cet ordre de grandeur n'engage rien.

## 8. Nom de domaine

`infra/src/dns.ts` s'en charge, à condition que la zone soit chez **Cloudflare**. Le module est
inerte tant que `appHostname` et `cloudflareZoneId` ne sont pas configurés : un projet qui n'en
veut pas n'a rien à faire, et aucun jeton Cloudflare à fournir.

### Ce que Pulumi pose

1. Un CNAME `app.mondomaine.fr` → endpoint du conteneur.
2. Un `scaleway.containers.Domain`, qui attache le nom au conteneur et déclenche l'émission du
   certificat. `dependsOn` garantit l'ordre : Scaleway valide par un challenge HTTP-01 et le
   CNAME doit résoudre avant.
3. Les CNAME du domaine custom Clerk, indépendants du conteneur — ils peuvent donc être posés
   dès le premier `pulumi up`, avant même qu'une image existe.

### Configuration

Le jeton Cloudflare se fabrique dans *My Profile → API Tokens*, à partir du gabarit
**« Edit zone DNS »** (`Zone:DNS:Edit` + `Zone:Read`), restreint à la seule zone concernée.
L'identifiant de zone se lit dans l'onglet *Overview* du domaine. Il passe par
`pulumi config set --secret cloudflare:apiToken`, jamais par une variable d'environnement — le
stack porte son identité, comme pour `scaleway:profile`.

Les cinq CNAME Clerk se recopient du dashboard Clerk → *Domains* dans `clerkDnsRecords` (voir
`Pulumi.prod.yaml.example`). `host` et `target` sont des **noms complets** : le provider
Cloudflare v6 ne prend plus de nom relatif à la zone. Ils restent en résolution directe — Clerk
exige des enregistrements « DNS only », le proxy Cloudflare fait échouer sa vérification.

### Si le domaine reste en erreur

Scaleway a **trois minutes** pour valider ; passé ce délai le domaine part en `error` et il faut
relancer `pulumi up`. Les causes habituelles :

- CNAME pas encore propagé, ou **cache DNS négatif** si le nom a été interrogé avant sa création ;
- un ancien enregistrement au TTL long ;
- un enregistrement **CAA** qui n'autorise pas `letsencrypt.org` ;
- le proxy Cloudflare (`cloudflareProxied`), qui met en cache `/.well-known/acme-challenge`.

`appHostname` doit être un sous-domaine : l'apex demanderait le CNAME flattening de Cloudflare,
hors périmètre de ce socle.

## 9. Détruire

```bash
cd infra && pulumi destroy --stack prod
```

Le bucket refuse d'être détruit s'il contient encore des objets : videz-le, ou passez
`forceDestroy: true` sur la ressource `object.Bucket`.

Les enregistrements Cloudflare partent avec le reste : le jeton doit être encore valide.
