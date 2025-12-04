# CRSet Cascade

This project implements a padded Bloom filter cascade based on `sha256`. It provides utility functions to construct, reconstruct, and verify the presence of elements within the padded Bloom filter cascade. It is intended as a library for the CRSet revocation mechanism for Verifiable Credentials. Instead of using this library directly, consider using the respective higher-level ones for issuers and verifiers:

- ![GitHub](https://img.shields.io/badge/GitHub-crset--issuer--backend-blue?logo=github) [**for issuers.**](https://github.com/flhps/crset-issuer-backend)
- ![GitHub](https://img.shields.io/badge/GitHub-crset--check-blue?logo=github) [**for verifiers.**](https://github.com/flhps/crset-check)

## Usage

This package can be installed directly from the repository:

```bash
npm install github:flhps/crset-cascade
```

Then, in your project, import the necessary functions and use them as follows:

```typescript
import { CRSetCascade, random256BitHexString } from "crset-cascade";

// Elements have to be of uniform generation and must use this method to generate them
const element: string = random256BitHexString();

// Construct a CRSet cascade
const validElements: Set<string> = new Set([element, "...", "..."]); // Set of valid elements
const invalidElements: Set<string> = new Set(["...", "...", "..."]); // Set of invalid elements
const rHat: number = x; // Total targeted size x, where rHat >= |validElements| and rHat >= 2*|invalidElements|
const cascade = CRSetCascade.fromSets(validElements, invalidElements, rHat);

// Check if an element is in the CRSet cascade
const result = cascade.has(element); // true if the element is in the CRSet cascade, false otherwise

// Serialize and deserialize the CRSet cascade
const filterHexString = cascade.toDataHexString(); // Hexadecimal string representing the CRSet cascade
const [filter, salt] = CRSetCascade.fromDataHexString(filterHexString); // Reconstruct the CRSet cascade from the hexadecimal string

// Get information about the CRSet cascade
const depth = cascade.getDepth(); // number of layers in the CRSet cascade
const layers = cascade.getLayers(); // array of Bloom filters
const salt = cascade.getSalt(); // salt used to construct the CRSet cascade
```

## Testing

To verify that this implementation works as expected, run the following command in the root directory:

```bash
npm test
```

## Acknowledgments

We thank the Ethereum Foundation for funding this work with an Ethereum Academic Grant under reference number FY24-1545.

## Links and References

- ![arXiv](https://img.shields.io/badge/arXiv-2501.17089-b31b1b.svg)
  **[CRSet: Non-Interactive Verifiable Credential Revocation with Metadata Privacy for Issuers and Everyone Else](https://arxiv.org/abs/2501.17089)**  
  _Hoops et al., 2025._
