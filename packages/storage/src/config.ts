export interface StorageConfig {
  readonly endpoint: string;
  /** Endpoint atteignable par le navigateur : c'est lui qui signe les URL remises au client. */
  readonly publicEndpoint: string;
  readonly region: string;
  readonly bucket: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly forcePathStyle: boolean;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

export function readStorageConfig(): StorageConfig {
  const endpoint = required("S3_ENDPOINT");
  return {
    endpoint,
    publicEndpoint: process.env.S3_PUBLIC_ENDPOINT ?? endpoint,
    region: process.env.S3_REGION ?? "us-east-1",
    bucket: required("S3_BUCKET"),
    accessKeyId: required("S3_ACCESS_KEY_ID"),
    secretAccessKey: required("S3_SECRET_ACCESS_KEY"),
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
  };
}
