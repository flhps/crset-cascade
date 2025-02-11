# padded-bloom-filter-cascade

This project implements a padded Bloom Filter Cascade based on `sha256`. It provides utility functions to construct, reconstruct, and verify the presence of elements within the padded Bloom Filter Cascade.

## Usage

To use the padded Bloom Filter Cascade, install the package via npm:

```
npm install
```

Then, in your project, import the necessary functions and use them as follows:

```typescript
import {
  constructBFC,
  fromDataHexString,
  isInBFC,
  toDataHexString,
} from "padded-bloom-filter-cascade";

const element: string = "..."; // Element to check later on if it is in the Bloom Filter Cascade

// Construct a Bloom Filter Cascade
const validElements: Set<string> = new Set([element, "...", "..."]); // Set of valid elements
const invalidElements: Set<string> = new Set(["...", "...", "..."]); // Set of invalid elements
const rHat: number = x; // Padding size x, where rHat >= |validElements|
const constructedBFC = constructBFC(validElements, invalidElements, rHat); // returns [filter, salt]

console.log(constructedBFC[0]); // Constructed Bloom Filter Cascade

// Check if an element is in the Bloom Filter Cascade
const filterHexString = toDataHexString(constructedBFC); // Hexadecimal string representing the Bloom Filter Cascade
const [filter, salt] = fromDataHexString(filterHexString); // Reconstruct the Bloom Filter Cascade from the hexadecimal string

const result = isInBFC(filter, salt, element);

console.log(result); // true if the element is in the Bloom Filter Cascade, false otherwise
```

## Testing

To verify that this implementation works as expected, run the following command in the root directory:

```
npm test
```

## Links and References

- ![arXiv](https://img.shields.io/badge/arXiv-2501.17089-b31b1b.svg)
  **[CRSet: Non-Interactive Verifiable Credential Revocation with Metadata Privacy for Issuers and Everyone Else](https://arxiv.org/abs/2501.17089)**  
  _Hoops et al., 2025._
