import { KeyManagementServiceClient } from "@google-cloud/kms";
import { secp256k1 } from "@noble/curves/secp256k1";
const client = new KeyManagementServiceClient();

export interface Key {
  projectId: string;
  locationId: string;
  keyRingId: string;
  keyId: string;
  versionId: string;
}
function getKeyName({
  projectId,
  locationId,
  keyRingId,
  keyId,
  versionId,
}: Key) {
  return client.cryptoKeyVersionPath(
    projectId,
    locationId,
    keyRingId,
    keyId,
    versionId
  );
}

export async function fetchPublicKey(key: Key) {
  return client.getPublicKey({
    name: getKeyName(key),
  });
}

export async function kmsSign(key: Key, hash: Buffer) {
  const name = getKeyName(key);
  const [signResponse] = await client.asymmetricSign({
    name,
    digest: {
      sha256: hash,
    },
  });

  if (signResponse.name !== name) {
    throw new Error("AsymmetricSign: request corrupted in-transit");
  }

  return secp256k1.Signature.fromDER(signResponse.signature!);
}
