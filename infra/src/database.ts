import * as pulumi from "@pulumi/pulumi";
import * as random from "@pulumi/random";
import * as scaleway from "@pulumiverse/scaleway";

import { resourceName, settings } from "./config.ts";
import { privateNetwork } from "./network.ts";

const DB_NAME = "app";
const DB_USER = "app";

const password = new random.RandomPassword("db-password", {
  length: 32,
  special: true,
  // Ces caractères casseraient l'URL de connexion.
  overrideSpecial: "-_=+",
});

export const instance = new scaleway.databases.Instance("database", {
  name: resourceName("db"),
  region: settings.region,
  engine: "PostgreSQL-17",
  nodeType: settings.dbNodeType,
  volumeType: "sbs_5k",
  volumeSizeInGb: settings.dbVolumeSizeInGb,
  isHaCluster: false,
  disableBackup: false,
  backupScheduleFrequency: 24,
  backupScheduleRetention: 7,
  userName: DB_USER,
  password: password.result,
  privateNetwork: {
    pnId: privateNetwork.id,
    // IPAM attribue l'adresse et publie un nom d'hôte stable dans le réseau privé.
    enableIpam: true,
  },
});

export const database = new scaleway.databases.Database("database-app", {
  instanceId: instance.id,
  region: settings.region,
  name: DB_NAME,
});

/**
 * Endpoint public ouvert au seul bloc `adminCidr`, pour lancer les migrations et
 * `db:studio` depuis votre poste. Sans `adminCidr`, aucune règle n'est créée et la base
 * n'est joignable que depuis le réseau privé.
 */
export const acl = settings.adminCidr
  ? new scaleway.databases.Acl("database-acl", {
      instanceId: instance.id,
      region: settings.region,
      aclRules: [{ ip: settings.adminCidr, description: "Poste d'administration" }],
    })
  : undefined;

function connectionUrl(host: pulumi.Input<string>, port: pulumi.Input<number>, sslMode: string) {
  return pulumi.interpolate`postgresql://${DB_USER}:${password.result}@${host}:${port}/${database.name}?sslmode=${sslMode}`;
}

/**
 * URL utilisée par le conteneur : le trafic ne quitte jamais le réseau privé, d'où
 * `sslmode=disable`. L'endpoint public, lui, exige TLS.
 */
export const privateDatabaseUrl = instance.privateNetwork.apply((pn) => {
  const host = pn?.hostname ?? pn?.ip;
  if (!host) {
    throw new Error("Le réseau privé de l'instance PostgreSQL n'expose ni hostname ni ip");
  }
  return connectionUrl(host, pn?.port ?? 5432, "disable");
});

/**
 * URL d'administration, via l'endpoint public (soumise à l'ACL ci-dessus). L'adresse vient
 * du `loadBalancer` : `endpointIp` et `endpointPort` sont dépréciés au profit de cet attribut.
 */
const adminHost = instance.loadBalancer.apply((loadBalancer) => {
  const host = loadBalancer?.hostname ?? loadBalancer?.ip;
  if (!host) {
    throw new Error("L'instance PostgreSQL n'expose ni hostname ni ip sur son endpoint public");
  }
  return host;
});

const adminPort = instance.loadBalancer.apply((loadBalancer) => loadBalancer?.port ?? 5432);

export const adminDatabaseUrl = connectionUrl(adminHost, adminPort, "no-verify");
