import Eth from "@ledgerhq/hw-app-eth";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import { AffinePoint } from "@noble/curves/abstract/curve";
import { Hex } from "@noble/curves/abstract/utils";
import { secp256k1 } from "@noble/curves/secp256k1";
import { sha256 } from "@noble/hashes/sha256";
import { randomBytes } from "@noble/hashes/utils";
import { execSync } from "child_process";
import { readFileSync, unlinkSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

export const KEY_PATH = "44'/52752'/0'/0/0";

const uint32 = 4;
const uint8 = 1;
const CONTRACT_ADDRESS_BYTE_LENGTH = 20; // 20 bytes
const DECIMALS_BYTE_LENGTH = uint32;
const CHAIN_ID_BYTE_LENGTH = uint32;

interface Parsed {
  size: number;
  private: Buffer;
  public: Buffer;
  type: string;
}
export interface Token {
  ticker: string;
  address: string;
  decimals: number;
  chainId: number;
}
export interface TokenInformation extends Token {
  data: Buffer;
  signature: Buffer;
}
export type SignFn = (msgHash: string) => Promise<{ r: bigint; s: bigint }>;

// This parses the ouput of the following command
// `openssl ec -in key.pem -text -noout -out priv-pub-key`
export function parseKey(filePath: string): Parsed {
  const file = readFileSync(filePath).toString("utf-8");
  const size = parseInt(file.match(/(Private|Public)-Key: \((\d+)/)![2], 10);
  const priv = file.match(/priv:(.+)pub:/s)?.[1];
  const pub = file.match(/pub:(.+)ASN1 OID:/s)![1];
  const type = file.match(/ASN1 OID:(.+)/)![1].trim();

  return {
    private: Buffer.from((priv || "").replace(/[\s\n\:]/g, ""), "hex"),
    public: Buffer.from(pub.replace(/[\s\n\:]/g, ""), "hex"),
    size,
    type,
  };
}

// `openssl ec -in key.pem -text -noout -out priv-pub-key`
export function parseKsmKey(pem: string): Parsed {
  const tmpPem =
    join(tmpdir(), Buffer.from(randomBytes(16)).toString("hex")) + ".pem";
  const tmpPub =
    join(tmpdir(), Buffer.from(randomBytes(16)).toString("hex")) + ".pub";
  writeFileSync(tmpPem, pem);

  execSync(`openssl ec -pubin -in ${tmpPem} -text -noout -out ${tmpPub}`);

  const result = parseKey(tmpPub);

  unlinkSync(tmpPem);
  unlinkSync(tmpPub);

  return result;
}

// This function exports a public key into the format used in ledger
// it's an array of hex values in C
export function formatKey(point: AffinePoint<bigint>) {
  const x = Buffer.from(point.x.toString(16), "hex");
  const y = Buffer.from(point.y.toString(16), "hex");

  let xStr = "";
  for (let i = 0; i < x.length; i++) {
    xStr += "0x" + x[i].toString(16) + ",";
    if (i % 8 == 7) {
      xStr += "\n";
    }
  }
  let yStr = "";
  for (let i = 0; i < y.length; i++) {
    yStr += "0x" + y[i].toString(16);
    if (i != y.length - 1) {
      yStr += ",";
    }
    if (i % 8 == 7) {
      yStr += "\n";
    }
  }
  return `0x04,\n\n${xStr}\n\n${yStr}`;
}

// Copied from https://github.com/LedgerHQ/ledger-live/blob/develop/libs/ledgerjs/packages/hw-app-eth/src/services/ledger/erc20.ts
export const parseNewData = (erc20SignaturesBlob: string) => {
  const asContractAddress = (addr: string) => {
    const a = addr.toLowerCase();
    return a.startsWith("0x") ? a : "0x" + a;
  };

  const buf = Buffer.from(erc20SignaturesBlob, "base64");
  const entries: TokenInformation[] = [];
  let i = 0;

  while (i < buf.length) {
    const length = buf.readUInt32BE(i);
    i += 4;
    const item = buf.slice(i, i + length);
    let j = 0;
    const tickerLength = item.readUInt8(j);
    j += 1;
    const ticker = item.slice(j, j + tickerLength).toString("ascii");
    j += tickerLength;
    const contractAddress = asContractAddress(
      item.slice(j, j + 20).toString("hex")
    );
    j += 20;
    const decimals = item.readUInt32BE(j);
    j += 4;
    const chainId = item.readUInt32BE(j);
    j += 4;
    const signature = item.slice(j);
    const entry = {
      ticker,
      address: contractAddress,
      decimals,
      chainId,
      signature,
      data: item,
      data_b64: item.toString("base64"),
      data_hex: item.toString("hex"),
    };
    entries.push(entry);
    i += length;
  }

  return {
    list: () => entries,
  };
};

// This function serializes each token in the tokens.json
// then signs each entry separately, serializes each in the following format:
//      data = Buffer[ticker, address, decimal, chainId]
//      signature = secp256k1.sign(sha256(data))
//      Buffer[data.length, ticker.length, data, signature]
export async function sign(sign: SignFn, pubKey: Hex, tokens: Token[]) {
  const tokenBufs = [] as Buffer[];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const ticker = Buffer.from(token.ticker, "ascii");

    let bufLength = 0;
    bufLength += ticker.byteLength; // ticker length
    bufLength += CONTRACT_ADDRESS_BYTE_LENGTH; // contract address, 20 bytes
    bufLength += DECIMALS_BYTE_LENGTH; // decimals, uint32
    bufLength += CHAIN_ID_BYTE_LENGTH; // chainId, uint32

    const msg = Buffer.alloc(bufLength);

    let offset = 0;
    msg.write(token.ticker, offset, "ascii");
    offset += ticker.byteLength;
    msg.write(token.address, offset, "hex");
    offset += CONTRACT_ADDRESS_BYTE_LENGTH;
    msg.writeUInt32BE(token.decimals, offset);
    offset += DECIMALS_BYTE_LENGTH;
    msg.writeUInt32BE(token.chainId, offset);
    offset += CHAIN_ID_BYTE_LENGTH;

    const msgHash = Buffer.from(sha256(msg));
    const { r, s } = await sign(msgHash.toString("hex"));
    const sig = new secp256k1.Signature(r, s);
    const valid = secp256k1.verify(sig, msgHash, pubKey, { lowS: false });

    if (!valid) {
      console.log(`/!\\ problem with signature /!\\`);
      process.exit(1);
    }

    const sigDer = Buffer.from(sig.toDERRawBytes());
    const dataLength = uint8 + msg.byteLength + sigDer.byteLength;
    const bufWithLengthAndSig = Buffer.alloc(uint32 + dataLength);

    offset = 0;
    // write the expected length of the following data
    bufWithLengthAndSig.writeUInt32BE(dataLength, offset);
    offset += uint32;
    // write the bytelength of the currency name to help ledger decode it
    // this is important because that's the only variable length in the msg
    bufWithLengthAndSig.writeUInt8(ticker.byteLength, offset);
    offset += uint8;
    // write the msg that was signed
    msg.copy(bufWithLengthAndSig, offset);
    offset += msg.byteLength;
    // append the signature
    sigDer.copy(bufWithLengthAndSig, offset);
    offset += sigDer.byteLength;

    tokenBufs.push(bufWithLengthAndSig);
  }
  const finalBuf = Buffer.concat(tokenBufs).toString("base64");
  return finalBuf;
}

// This function is a sanity check and feeds the data signed in `sign` back to
// ledger to make sure it works
export async function verifyData(
  base64Data: string,
  ledger?: Eth,
  verbose = false
) {
  if (!ledger) {
    const transport = await createTransport();
    ledger = new Eth(transport);
  }

  const data = parseNewData(base64Data);
  for (const tokenInfo of data.list()) {
    try {
      await ledger.provideERC20TokenInformation(tokenInfo.data.toString("hex"));
      if (verbose) {
        console.log(
          `verified: ${tokenInfo.ticker}, ${tokenInfo.address}, ${
            tokenInfo.chainId
          }, ${tokenInfo.data.toString("hex")}`
        );
      }
    } catch (e) {
      console.log("failed to verify", tokenInfo);
      throw e;
    }
  }
}

export async function createTransport() {
  return TransportNodeHid.open("").catch((e) => {
    if (e.id === "NoDevice") {
      throw "No device detected, did you plug in your ledger?";
    }
    throw e;
  });
}
