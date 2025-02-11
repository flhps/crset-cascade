import { BloomFilter } from "./bloom-filter";
import {
  binaryStringToBuffer,
  convertSetToBinary,
  drawNFromSet,
  generateRandom256BitString,
  hexToBinary,
} from "../utils";

/**
 * Constructs a Bloom Filter Cascade (BFC) from the given sets of valid and revoked IDs.
 *
 * @param validIds - A set of valid IDs.
 * @param revokedIds - A set of revoked IDs.
 * @param rHat - Padding size r hat, where `rHat >= |validElements|`. Achieved by padding with random IDs.
 * @returns A tuple containing an array of BloomFilters and a salted string.
 *
 * The function performs the following steps:
 * 1. Checks if the sizes of validIds and revokedIds meet the requirements.
 * 2. Converts the sets of valid and revoked IDs to binary format.
 * 3. Draws the required number of elements from the sets.
 * 4. Generates a random 256-bit salted string.
 * 5. Constructs the Bloom Filter Cascade by iteratively creating Bloom Filters
 *    and testing for false positives.
 *
 * If the requirements are not fulfilled, it returns an empty array and a "0" string.
 */
export function constructBFC(
  validIds: Set<string>,
  revokedIds: Set<string>,
  rHat: number
): [BloomFilter[], string] {
  if (validIds?.size > rHat || revokedIds?.size > 2 * rHat) {
    //TODO more descriptive error message
    console.log("Error: Requirements not fulfilled. Returning empty array");
    return [[], "0"];
  }
  const sHat = 2 * rHat;
  const neededR = rHat - validIds?.size;
  const neededS = sHat - revokedIds?.size;

  validIds = convertSetToBinary(validIds);
  revokedIds = convertSetToBinary(revokedIds);

  drawNFromSet(validIds, revokedIds, neededR, true);
  drawNFromSet(validIds, revokedIds, neededS, false);

  const salt = generateRandom256BitString();

  const pb = 0.5;
  const pa = Math.sqrt(0.5) / 2;

  let includedSet = validIds;
  let excludedSet = revokedIds;
  let filter: BloomFilter[] = [];
  let cascadeLevel = 1;
  while (includedSet.size > 0) {
    const sizeInBit =
      (-1.0 * includedSet.size * Math.log(cascadeLevel === 1 ? pa : pb)) /
      (Math.log(2) * Math.log(2));
    const currentFilter = new BloomFilter(sizeInBit, 1);
    includedSet.forEach((id) => {
      currentFilter.add(
        id + cascadeLevel.toString(2).padStart(8, "0") + salt
      );
    });
    filter.push(currentFilter);
    let falsePositives = new Set<string>();
    excludedSet.forEach((id) => {
      if (
        currentFilter.test(
          id + cascadeLevel.toString(2).padStart(8, "0") + salt
        )
      ) {
        falsePositives.add(id);
      }
    });
    excludedSet = includedSet;
    includedSet = falsePositives;
    cascadeLevel++;
  }
  return [filter, salt];
}

/**
 * Checks if a given value is in the Bloom Filter Cascade (BFC).
 *
 * @param value - The value to check in the BFC.
 * @param bfc - An array of BloomFilter objects representing the cascade.
 * @param salt - A salted string used in the Bloom Filter test.
 * @returns `true` if the value is in the BFC, `false` otherwise.
 */
export function isInBFC(
  value: string,
  bfc: BloomFilter[],
  salt: string
): boolean {
  let cascadeLevel = 0;
  let id = hexToBinary(value);
  for (let i = 0; i < bfc.length; i++) {
    cascadeLevel++;
    if (
      !bfc[i]?.test(id + cascadeLevel.toString(2).padStart(8, "0") + salt)
    ) {
      return cascadeLevel % 2 === 0;
    }
  }
  return !(cascadeLevel % 2 === 0);
}

/**
 * Converts a Bloom Filter Cascade (BFC) to a hexadecimal string representation.
 *
 * @param { [BloomFilter[], string] } bfc - A tuple containing an array of BloomFilters and a salt string.
 * @returns { string } - The hexadecimal string representation of the serialized Bloom Filter Cascade.
 *
 * The function performs the following steps:
 * 1. Serializes each BloomFilter in the cascade by converting its buckets to a buffer and prefixing it with its length.
 * 2. Converts the salt string to a buffer.
 * 3. Concatenates the serialized BloomFilters and the salt buffer.
 * 4. Returns the concatenated buffer as a hexadecimal string prefixed with "0x".
 */
export function toDataHexString(bfc: [BloomFilter[], string]): string {
  const serializedCascade = bfc[0].map((filter) => {
    // Create a buffer from the filter's buckets
    const buffer = Buffer.from(
      filter.buckets.buffer,
      filter.buckets.byteOffset,
      filter.buckets.byteLength
    );

    // Allocate 4 bytes for length prefix
    const lengthPrefix = Buffer.alloc(4);
    lengthPrefix.writeUInt32BE(buffer.length, 0);
    
    // Also store the size of the filter (m) as this is needed for reconstruction
    const sizePrefix = Buffer.alloc(4);
    sizePrefix.writeUInt32BE(filter['m'], 0);
    
    return Buffer.concat([lengthPrefix, sizePrefix, buffer]);
  });

  // Create a Buffer to store the salt
  const serializedSalt = binaryStringToBuffer(bfc[1]);
  
  // Create a Buffer from the array of Buffers
  const serializedCascadeBuffer = Buffer.concat(serializedCascade);
  
  // Concatenate the salt and the buffer of filterCascade
  const serializedArray = Buffer.concat([
    serializedSalt,
    serializedCascadeBuffer,
  ]);
  
  return `0x${serializedArray.toString("hex")}`;
}

/**
 * Deserializes a hex string into an array of Bloom filters and a salt string.
 *
 * @param serialized - The hex string to deserialize. It should start with "0x".
 * @returns A tuple containing an array of BloomFilter objects and a salt string.
 *
 * The hex string is expected to be in the following format:
 * - The first 32 bytes represent the salt.
 * - The remaining bytes represent the Bloom filters, each prefixed with a 4-byte length.
 *
 * The function performs the following steps:
 * 1. Converts the hex string to a buffer.
 * 2. Extracts the first 32 bytes as the salt.
 * 3. Iterates over the remaining buffer to extract Bloom filters.
 * 4. For each Bloom filter, reads the length prefix and the filter content.
 * 5. Creates a new BloomFilter object and sets its buckets from the filter content.
 * 6. Returns the array of BloomFilter objects and the salt string.
 */
export function fromDataHexString(serialized: string): [BloomFilter[], string] {
  // Create a buffer from the hex string
  const buffer = Buffer.from(serialized.slice(2), "hex");

  // Extract the salt - the first 32 bytes
  const saltBuffer = buffer.subarray(0, 32);
  const salt = Array.from(saltBuffer)
    .map((byte) => byte.toString(2).padStart(8, "0"))
    .join("");

  const bloomFilters: BloomFilter[] = [];

  let startIndex = 32;
  while (startIndex < buffer.length) {
    // Read the length which takes 4 bytes
    const length = buffer.readUInt32BE(startIndex);
    startIndex += 4;

    // Read the filter size (m) which takes 4 bytes
    const m = buffer.readUInt32BE(startIndex);
    startIndex += 4;

    // Read the Bloom filter content
    const filterContent = buffer.subarray(
      startIndex,
      startIndex + length
    );
    startIndex += length;

    // Create a new bloom filter with the original size
    const currentFilter = new BloomFilter(m, 1);
    
    // Set the buckets from the buffer
    currentFilter.buckets = new Int32Array(
      filterContent.buffer,
      filterContent.byteOffset,
      filterContent.byteLength / Int32Array.BYTES_PER_ELEMENT
    );
    
    bloomFilters.push(currentFilter);
  }
  
  return [bloomFilters, salt];
}
