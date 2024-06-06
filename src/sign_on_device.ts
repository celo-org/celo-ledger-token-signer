import * as fs from "fs";
import {
  KEY_PATH,
  Token,
  createTransport,
  formatKey,
  sign,
  verifyData,
} from "./utils";
import { secp256k1 } from "@noble/curves/secp256k1";
import Eth from "@ledgerhq/hw-app-eth";

async function main() {
  const transport = await createTransport();
  const ledger = new Eth(transport);
  const pubKey = (await ledger.getAddress(KEY_PATH)).publicKey;
  const point = secp256k1.ProjectivePoint.fromHex(pubKey);

  console.log("--- BEGIN PUBLIC KEY VERIFICATION ---\n");
  console.log("Using the ledger matching the following pubkey:");
  console.log(formatKey(point));
  console.log(
    "Please make sure it matches the one in the celo-spender C application loaded onto the ledger device."
  );
  console.log("--- END PUBLIC KEY VERIFICATION ---\n");

  console.log("--- BEGIN SIGNING DATA BLOB FOR LEDGER ERC20 DATA ---\n");
  const tokens = JSON.parse(
    fs.readFileSync("./tokens.json").toString()
  ) as Token[];

  // DISCLAIMER
  // As it stands, this signing function CANNOT work as `signPersonalMessage` adds a prefix to the msg being signed
  // and since this isn't expected by `provideERC20TokenInformation`'s implementation in the celo-spender app
  // it just won't match.
  // This file exists for legacy purposes as MAYBE it was signed via ledger
  // but most likely was signed locally with and export hdwallet originating from ledger
  const ledgerSign = (msgHash: string) =>
    ledger.signPersonalMessage(KEY_PATH, msgHash).then(({ r, s }) => ({
      r: BigInt(`0x${r}`),
      s: BigInt(`0x${s}`),
    }));

  const finalBuf = await sign(ledgerSign, pubKey, tokens);
  console.log("BASE64 blob to be stored in the monorepo:");
  console.log(finalBuf);
  console.log("\n--- END SIGNING DATA BLOB FOR LEDGER ERC20 DATA ---\n");

  console.log("--- BEGIN VERIFYING DATA BLOB WITH CONNECTED LEDGER ---\n");
  try {
    await verifyData(finalBuf, ledger);
  } catch (e) {
    console.error("Some tokens couldn't be verified");
    throw e;
  } finally {
    console.log("--- END VERIFYING DATA BLOB WITH CONNECTED LEDGER ---");
  }
}

main().catch((e) => {
  console.error(e);
});
