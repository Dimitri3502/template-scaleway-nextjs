import * as cloudflare from "@pulumi/cloudflare";
import * as scaleway from "@pulumiverse/scaleway";

import { container } from "./app.ts";
import { settings } from "./config.ts";

/**
 * DNS Cloudflare, entièrement optionnel : sans `appHostname` ni `cloudflareZoneId`, rien
 * n'est créé et le provider n'est même pas instancié — le stack n'a alors aucun jeton
 * Cloudflare à porter. Trois blocs :
 *  1. le CNAME de l'application vers l'endpoint du conteneur ;
 *  2. le binding Scaleway, qui attache le nom d'hôte au conteneur et fait émettre le
 *     certificat — il exige que le CNAME résolve déjà, d'où le `dependsOn` ;
 *  3. les CNAME du domaine custom Clerk, qui ne dépendent ni du conteneur ni de `appHostname`.
 *
 * Les deux premiers disparaissent si `imageTag` est retiré de la configuration : sans image,
 * pas de conteneur, donc plus rien à faire pointer.
 */
const zone =
  settings.appHostname && settings.cloudflareZoneId
    ? { hostname: settings.appHostname, id: settings.cloudflareZoneId }
    : undefined;

/** `publicEndpoint` porte le schéma (`https://…`) ; un CNAME veut un nom d'hôte nu. */
function cnameTarget(endpoint: string): string {
  const hostname = endpoint.startsWith("http") ? new URL(endpoint).hostname : endpoint;
  return hostname.replace(/\.$/, "");
}

export const webDnsRecord =
  zone && container
    ? new cloudflare.DnsRecord("web-dns-record", {
        zoneId: zone.id,
        // Nom complet, pas relatif à la zone : le provider v6 diffère sans cesse sinon.
        name: zone.hostname,
        type: "CNAME",
        content: container.publicEndpoint.apply(cnameTarget),
        // Cloudflare impose le TTL automatique (1) sur un enregistrement proxifié.
        ttl: settings.cloudflareProxied ? 1 : settings.dnsTtl,
        proxied: settings.cloudflareProxied,
        comment: "Managed by Pulumi",
      })
    : undefined;

export const webDomain =
  zone && container && webDnsRecord
    ? new scaleway.containers.Domain(
        "web-domain",
        {
          containerId: container.id,
          hostname: zone.hostname,
          region: settings.region,
        },
        // Scaleway valide par un challenge HTTP-01 de trois minutes : sans CNAME, il échoue.
        { dependsOn: [webDnsRecord] },
      )
    : undefined;

/** Jamais proxifiés : Clerk exige des enregistrements « DNS only » pour vérifier le domaine. */
export const clerkDnsRecords = zone
  ? settings.clerkDnsRecords.map(
      (record) =>
        new cloudflare.DnsRecord(`clerk-${record.key}`, {
          zoneId: zone.id,
          name: record.host,
          type: "CNAME",
          content: record.target,
          ttl: settings.dnsTtl,
          proxied: false,
          comment: "Managed by Pulumi (Clerk)",
        }),
    )
  : [];
