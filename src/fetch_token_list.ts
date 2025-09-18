import { feeCurrencyDirectoryABI } from "@celo/abis";
import { writeFileSync } from "fs";

import {
  Address,
  createPublicClient,
  erc20Abi,
  http,
  InvalidAddressError,
  PublicClient,
  Transport,
} from "viem";
import { celo, celoSepolia } from "viem/chains";
import { resolveAddress } from "@celo/actions";
import { Token } from "./utils";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const STANDARD_ADAPTER_TOKEN_ABI = [
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
const USDT_ADAPTER_TOKEN_ABI = [
  ...erc20Abi,
  {
    type: "function",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address", name: "", internalType: "address" }],
    name: "getAdaptedToken",
  },
] as const;

type Client = PublicClient<Transport, typeof celo | typeof celoSepolia>;

function formatTicker(chain: number, ticker: string): string {
  switch (chain) {
    case celo.id:
      return ticker;
    case celoSepolia.id:
      return `s ${ticker}`;
  }

  throw new Error("unknown chain: " + chain);
}

function formatAddress(address: string): string {
  return address.startsWith("0x") ? address.slice(2) : address;
}

function formatToken(token: Token): Token {
  // specific fields order for easier diffing
  return {
    ticker: formatTicker(token.chainId, token.ticker),
    address: formatAddress(token.address),
    decimals: token.decimals,
    chainId: token.chainId,
  };
}

async function fetchAdaptedTokenInfo(
  client: Client,
  whitelistedAddress: Address,
  adaptedTokenAddress: Address
): Promise<[Token, Token]> {
  const [adapterDecimals, adaptedTokenDecimals, symbol] =
    await client.multicall({
      allowFailure: false,
      contracts: [
        {
          address: whitelistedAddress,
          abi: STANDARD_ADAPTER_TOKEN_ABI,
          functionName: "adapterDecimals",
        },
        {
          address: whitelistedAddress,
          abi: STANDARD_ADAPTER_TOKEN_ABI,
          functionName: "tokenDecimals",
        },
        {
          address: adaptedTokenAddress,
          abi: erc20Abi,
          functionName: "symbol",
        },
      ] as const,
    });

  return [
    {
      ticker: symbol,
      address: whitelistedAddress,
      decimals: adapterDecimals,
      chainId: client.chain.id,
    },
    {
      ticker: symbol,
      address: adaptedTokenAddress,
      decimals: adaptedTokenDecimals,
      chainId: client.chain.id,
    },
  ];
}

async function fetchUSDTTokenInfo(
  client: Client,
  address: Address,
  adaptedTokenAddress: Address
): Promise<[Token, Token]> {
  const [adapterDecimals, tokenDecimals] = await client.multicall({
    allowFailure: false,
    contracts: [
      {
        address,
        abi: USDT_ADAPTER_TOKEN_ABI,
        functionName: "decimals",
      },
      {
        address: adaptedTokenAddress,
        abi: erc20Abi,
        functionName: "decimals",
      },
    ] as const,
  });

  // NOTE: hardcode symbol because USD₮ isnt valid ascii and utf8 isn't
  // supported on ledger display apparently
  return [
    {
      ticker: "USDT",
      address,
      decimals: adapterDecimals,
      chainId: client.chain.id,
    },
    {
      ticker: "USDT",
      address: adaptedTokenAddress,
      decimals: tokenDecimals,
      chainId: client.chain.id,
    },
  ];
}

async function fetchErc20TokenInfo(
  client: Client,
  address: Address
): Promise<Token> {
  const [decimals, symbol] = await client.multicall({
    allowFailure: false,
    contracts: [
      {
        address,
        abi: erc20Abi,
        functionName: "decimals",
      },
      {
        address,
        abi: erc20Abi,
        functionName: "symbol",
      },
    ] as const,
  });

  return {
    ticker: symbol,
    address,
    decimals,
    chainId: client.chain.id,
  };
}

const chains = [celo, celoSepolia] as const;
async function main() {
  const clients = chains.map((chain) =>
    createPublicClient({
      chain,
      transport: http(),
      batch: { multicall: true },
    })
  );

  const tokens = (
    await Promise.all(
      clients.map(async (client) => {
        const whitelistAddress = await resolveAddress(
          client,
          "FeeCurrencyDirectory"
        );

        const whitelistedAddresses = await client.readContract({
          address: whitelistAddress,
          abi: feeCurrencyDirectoryABI,
          functionName: "getCurrencies",
        });

        return (
          await Promise.all(
            whitelistedAddresses.map(async (address) => {
              try {
                const adaptedTokenStandard = await client
                  .readContract({
                    address,
                    abi: STANDARD_ADAPTER_TOKEN_ABI,
                    functionName: "adaptedToken",
                  })
                  .catch(() => null);

                if (adaptedTokenStandard) {
                  return await fetchAdaptedTokenInfo(
                    client,
                    address,
                    adaptedTokenStandard
                  );
                }

                const adaptedTokenUSDT = await client
                  .readContract({
                    address,
                    abi: USDT_ADAPTER_TOKEN_ABI,
                    functionName: "getAdaptedToken",
                  })
                  .catch(() => null);

                if (adaptedTokenUSDT) {
                  return await fetchUSDTTokenInfo(
                    client,
                    address,
                    adaptedTokenUSDT
                  );
                }

                return await fetchErc20TokenInfo(client, address);
              } catch (e) {
                // make sure to throw on mainnet, this should always work!
                if (client.chain === celo) {
                  throw e;
                }
                // there's a couple of outdated tokens on testnets that won't fit the correct
                // adapter token contract...
                // eg: 0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B
                return [];
              }
            })
          )
        ).flat();
      })
    )
  )
    .flat()
    .map(formatToken);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const tokenJsonFilePath = resolve(__dirname, "..", "tokens.json");

  writeFileSync(tokenJsonFilePath, JSON.stringify(tokens, null, 2));
}

main();
