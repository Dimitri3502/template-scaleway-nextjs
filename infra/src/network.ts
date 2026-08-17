import * as scaleway from "@pulumiverse/scaleway";

import { resourceName, settings } from "./config.ts";

/**
 * Réseau privé régional : c'est par là que le conteneur joint PostgreSQL. La base n'a
 * donc pas besoin d'être exposée à Internet pour que l'application fonctionne.
 *
 * Pas de `isRegional` : l'attribut est déprécié, tous les réseaux privés sont désormais
 * régionaux — seul `region` compte.
 */
export const privateNetwork = new scaleway.network.PrivateNetwork("private-network", {
  name: resourceName("vpc"),
  region: settings.region,
});
