import { BloomFilter } from "./bloom-filter";
import { addUniqueRandomIdsToSet, random256BitHexString } from "../utils";

export class CRSetCascade {
  private readonly filters: BloomFilter[];
  private readonly salt: string;

  private constructor(filters: BloomFilter[], salt: string) {
    this.filters = filters;
    this.salt = salt;
  }

  /**
   * Constructs a CRSetCascade from the given sets of valid and revoked IDs.
   *
   * @param validIds - A set of valid IDs.
   * @param revokedIds - A set of revoked IDs.
   * @param rHat - Padding size r hat, where `rHat >= |validElements|`. Achieved by padding with random IDs.
   * @returns A tuple containing an array of BloomFilters and a salted string.
   */
  public static fromSets(
    validIds: Set<string>,
    revokedIds: Set<string>,
    rHat: number,
  ) {
    if (validIds.size > rHat || revokedIds.size > 2 * rHat) {
      throw new RangeError(
        `The size paramter rHat=${rHat} is too small for the given data of size ${validIds?.size} and ${revokedIds?.size}`,
      );
    }
    const sHat = 2 * rHat;
    const neededR = rHat - validIds.size;
    const neededS = sHat - revokedIds.size;

    addUniqueRandomIdsToSet(validIds, revokedIds, neededR, true);
    addUniqueRandomIdsToSet(validIds, revokedIds, neededS, false);

    const salt = random256BitHexString();

    const pb = 0.5;
    const pa = Math.sqrt(0.5) / 2;

    let includedSet = validIds;
    let excludedSet = revokedIds;
    const filters: BloomFilter[] = [];
    let cascadeLevel = 1;
    while (includedSet.size > 0) {
      const sizeInBit =
        (-1.0 * includedSet.size * Math.log(cascadeLevel === 1 ? pa : pb)) /
        (Math.log(2) * Math.log(2));
      const currentFilter = new BloomFilter(sizeInBit, 1);
      includedSet.forEach((id) => {
        currentFilter.add(
          id + cascadeLevel.toString(2).padStart(8, "0") + salt,
        );
      });
      filters.push(currentFilter);
      const falsePositives = new Set<string>();
      excludedSet.forEach((id) => {
        if (
          currentFilter.test(
            id + cascadeLevel.toString(2).padStart(8, "0") + salt,
          )
        ) {
          falsePositives.add(id);
        }
      });
      excludedSet = includedSet;
      includedSet = falsePositives;
      cascadeLevel++;
    }

    return new CRSetCascade(filters, salt);
  }

  /**
   * Constructs a CRSetCascade from a serialized hexadecimal string.
   *
   * @param serialized - The serialized CRSetCascade as a hexadecimal string.
   * @returns A new CRSetCascade object.
   */
  public static fromDataHexString(serialized: string): CRSetCascade {
    if (!serialized?.startsWith("0x")) {
      throw new Error("Invalid hex string format: must start with 0x");
    }

    const buffer = Buffer.from(serialized.slice(2), "hex");

    const saltBuffer = buffer.subarray(0, 32);
    const salt = Array.from(saltBuffer)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    const filters: BloomFilter[] = [];

    let startIndex = 32;
    while (startIndex < buffer.length) {
      const m = buffer.readUInt32BE(startIndex);
      startIndex += 4;

      const length = Math.ceil(m / 32) * 4;

      // If length is zero, these are just trailing zero bytes from a reconstructed blob
      if (length == 0) {
        break;
      }

      const filterContent = buffer.subarray(startIndex, startIndex + length);
      startIndex += length;

      const currentFilter = new BloomFilter(m, 1);

      currentFilter.buckets = new Int32Array(
        filterContent.buffer,
        filterContent.byteOffset,
        filterContent.byteLength / Int32Array.BYTES_PER_ELEMENT,
      );

      filters.push(currentFilter);
    }

    return new CRSetCascade(filters, salt);
  }

  /**
   * Serializes the CRSetCascade  to a hexadecimal string.
   *
   * Roughly: salt|filter0|filter1|... (where each filter is m|filterBits)
   *
   * @returns {string} The serialized CRSetCascade as a hexadecimal string.
   */
  public toDataHexString(): string {
    const serializedCascade = this.filters.map((filter) => {
      // Create a buffer from the filter's buckets
      const buffer = Buffer.from(
        filter.buckets.buffer,
        filter.buckets.byteOffset,
        filter.buckets.byteLength,
      );

      const sizePrefix = Buffer.alloc(4);
      sizePrefix.writeUInt32BE(filter["m"], 0);

      return Buffer.concat([sizePrefix, buffer]);
    });

    const serializedSalt = Buffer.from(this.salt, "hex");

    const serializedCascadeBuffer = Buffer.concat(serializedCascade);

    const serializedArray = Buffer.concat([
      serializedSalt,
      serializedCascadeBuffer,
    ]);

    return `0x${serializedArray.toString("hex")}`;
  }

  /**
   * Checks if a given value is in the CRSetCascade.
   *
   * @param value - The value to check in the CRSetCascade.
   * @returns {boolean} `true` if the value is in the CRSetCascade, `false` otherwise.
   */
  public has(value: string): boolean {
    let cascadeLevel = 0;
    for (let i = 0; i < this.filters.length; i++) {
      cascadeLevel++;
      if (
        !this.filters[i]?.test(
          value + cascadeLevel.toString(2).padStart(8, "0") + this.salt,
        )
      ) {
        return cascadeLevel % 2 === 0;
      }
    }
    return !(cascadeLevel % 2 === 0);
  }

  /**
   * Returns the depth of the CRSetCascade, which is the number of Bloom Filters in the cascade.
   *
   * @returns {number} The depth of the CRSetCascade.
   */
  public getDepth(): number {
    return this.filters.length;
  }

  /**
   * Returns the layers of the CRSetCascade, which is the array of Bloom Filters in the cascade.
   *
   * @returns {BloomFilter[]} The layers of the CRSetCascade.
   */
  public getLayers(): BloomFilter[] {
    return this.filters;
  }

  /**
   * Returns the salt of the CRSetCascade, which is the random string used to salt the Bloom Filters.
   *
   * @returns {string} The salt of the CRSetCascade.
   */
  public getSalt(): string {
    return this.salt;
  }
}
