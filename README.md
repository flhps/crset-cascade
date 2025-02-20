# CRSet Cascade

This project implements a padded Bloom filter cascade based on `sha256`. It provides utility functions to construct, reconstruct, and verify the presence of elements within the padded Bloom filter cascade. It is intended as a library for the CRSet revocation mechanism for Verifiable Credentials. Instead of using this library directly, consider using the respective higher-level ones for issuers and verifiers:

- ![GitHub](https://img.shields.io/badge/GitHub-crset--issuer--backend-blue?logo=github) [CRSet Issuer](https://github.com/jfelixh/crset-issuer-backend)
- ![GitHub](https://img.shields.io/badge/GitHub-crset--check-blue?logo=github) [CRSet Check](https://github.com/jfelixh/crset-check)

## Usage

This package can be installed directly from the repository:

```bash
npm install github:jfelixh/crset-cascade
```

Then, in your project, import the necessary functions and use them as follows:

```typescript
import {
  constructBFC,
  fromDataHexString,
  isInBFC,
  toDataHexString,
} from "crset-cascade";

const element: string = "..."; // Element to check later on if it is in the CRSet cascade

// Construct a CRSet cascade
const validElements: Set<string> = new Set([element, "...", "..."]); // Set of valid elements
const invalidElements: Set<string> = new Set(["...", "...", "..."]); // Set of invalid elements
const rHat: number = x; // Padding size x, where rHat >= |validElements|
const constructedBFC = constructBFC(validElements, invalidElements, rHat); // returns [filter, salt]

// Check if an element is in the CRSet cascade
const filterHexString = toDataHexString(constructedBFC); // Hexadecimal string representing the CRSet cascade
const [filter, salt] = fromDataHexString(filterHexString); // Reconstruct the CRSet cascade from the hexadecimal string

const result = isInBFC(filter, salt, element); // true if the element is in the CRSet cascade, false otherwise
```

## Testing

To verify that this implementation works as expected, run the following command in the root directory:

```bash
npm test
```

## Links and References

- ![arXiv](https://img.shields.io/badge/arXiv-2501.17089-b31b1b.svg)
  **[CRSet: Non-Interactive Verifiable Credential Revocation with Metadata Privacy for Issuers and Everyone Else](https://arxiv.org/abs/2501.17089)**  
  _Hoops et al., 2025._
