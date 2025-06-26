# ledger-token-signer

To install dependencies:

```bash
bun install
```

Then there are a couple things you are able to do:

### Prerequisites

You need access to akeyless, more specifically `/static-secrets/dev-tooling-circle/ledger-key`.

- Copy the private key into your clipboard then `pbpaste > key.pem`
- You can now run `bun verify-key`
- And then run `bun export-key`

It should create a file `priv-pub-key` that looks extremely similar to the template file left in priv-pub-key.template.

### Sign the tokens json with the clabs' akeyless private key

To run:

```bash
bun sign-local
```
