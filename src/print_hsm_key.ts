import { secp256k1 } from "@noble/curves/secp256k1";
import { formatKey, parseKsmKey } from "./utils";
import { fetchPublicKey } from "./config/google-cloud/kms";

const projectId =
  process.env.GCLOUD_PROJECT_ID || "blockchaintestsglobaltestnet";
const locationId = process.env.GCLOUD_LOCATION_ID || "europe-west9";
const keyRingId = process.env.GCLOUD_KEY_RING_ID || "Nicolas-test";
const keyId = process.env.GCLOUD_KEY_ID || "ledger-dev-test";
const versionId = process.env.GCLOUD_VERSION_ID || "1";

async function main() {
  const key = {
    projectId,
    locationId,
    keyRingId,
    keyId,
    versionId,
  };
  const [pubKey] = await fetchPublicKey(key);
  const keys = parseKsmKey(pubKey.pem!);

  console.log(formatKey(secp256k1.ProjectivePoint.fromHex(keys.public)));
}

main();
