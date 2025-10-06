import { Address, erc20Abi } from "viem";

interface CeloToken {
  name: string;
  address: Address;
  symbol: string;
  decimals: number;
  chainId: number;
  logoURI: string;
}

export interface CeloTokenList {
  name: string;
  version: { major: number; minor: number; patch: number };
  logoURI: string;
  keywords: string[];
  timestamp: string;
  tokens: CeloToken[];
}
export const CELO_TOKEN_LIST_GITHUB_URL =
  "https://celo-org.github.io/celo-token-list/celo.tokenlist.json";

export const STANDARD_ADAPTER_TOKEN_ABI = [
  {
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address", name: "", internalType: "address" }],
    name: "adaptedToken",
  },
  {
    type: "function",
    name: "adapterDecimals",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "uint8",
      },
    ],
  },
  {
    type: "function",
    name: "tokenDecimals",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        type: "uint8",
      },
    ],
  },
] as const;

//  USDT adapter uses slightly different interface this getAdaptedToken
export const USDT_ADAPTER_TOKEN_ABI = [
  ...erc20Abi,
  {
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address", name: "", internalType: "address" }],
    name: "getAdaptedToken",
  },
] as const;
