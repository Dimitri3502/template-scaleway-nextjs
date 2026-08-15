# syntax=docker/dockerfile:1

# Image de production de apps/web.
#
# ⚠️ Les variables NEXT_PUBLIC_* sont inlinées dans le bundle AU BUILD, pas lues à
# l'exécution. Elles arrivent donc ici en ARG et doivent être passées à `docker build`.
# Les définir comme variables d'environnement du conteneur Scaleway ne marcherait pas :
# le build serait vert et l'application cassée en ligne.

FROM node:24-alpine AS base
RUN corepack enable
WORKDIR /app


# --- Élagage : ne garder que apps/web et ses dépendances de workspace ---------
FROM base AS pruner
RUN npm install --global turbo@^2
COPY . .
RUN turbo prune @acme/web --docker


# --- Installation puis build -------------------------------------------------
FROM base AS builder

# `out/json` ne contient que les package.json et le lockfile : cette couche reste en
# cache tant qu'aucune dépendance ne bouge.
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
# `turbo prune` ne recopie pas les fichiers racine qu'il ne connaît pas : sans celui-ci,
# tous les tsconfig.json des paquets pointent vers un fichier absent et le build échoue.
COPY tsconfig.base.json ./

ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
ARG NEXT_PUBLIC_APP_VERSION=dev
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY \
    NEXT_PUBLIC_CLERK_SIGN_IN_URL=$NEXT_PUBLIC_CLERK_SIGN_IN_URL \
    NEXT_PUBLIC_CLERK_SIGN_UP_URL=$NEXT_PUBLIC_CLERK_SIGN_UP_URL \
    NEXT_PUBLIC_APP_VERSION=$NEXT_PUBLIC_APP_VERSION \
    NEXT_TELEMETRY_DISABLED=1

RUN pnpm turbo run build --filter=@acme/web


# --- Exécution ---------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# `output: "standalone"` produit un serveur autonome : aucun `pnpm install` ici.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs
EXPOSE 8080

CMD ["node", "apps/web/server.js"]
