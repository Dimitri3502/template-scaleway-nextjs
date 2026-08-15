import * as scaleway from "@pulumiverse/scaleway";

import { resourceName, settings } from "./config";

/**
 * Registre privé où `pnpm deploy` pousse l'image. Il doit exister avant le premier
 * `docker push` : c'est la raison de l'amorçage en deux temps décrit dans docs/DEPLOY.md.
 */
export const registryNamespace = new scaleway.registry.Namespace("registry", {
  name: resourceName("registry"),
  region: settings.region,
  isPublic: false,
});
