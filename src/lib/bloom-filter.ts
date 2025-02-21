import { createHash } from "crypto";

export class BloomFilter {
  private bits: Int32Array;
  private readonly m: number; // number of bits in the filter
  private readonly k: number; // number of hash functions

  /**
   * Creates a Bloom filter
   * @param m - The size of the bit array in bits
   * @param k - The number of hash functions to use
   */
  constructor(m: number, k: number = 1) {
    this.m = Math.ceil(m);
    this.k = k;
    this.bits = new Int32Array(Math.ceil(this.m / 32));
  }

  /**
   * Adds an element to the Bloom filter
   * @param element - The element to add
   */
  add(element: string): void {
    const positions = this.getHashPositions(element);
    for (const pos of positions) {
      this.setBit(pos);
    }
  }

  /**
   * Tests if an element might be in the set
   * @param element - The element to test
   * @returns true if the element might be in the set, false if it definitely isn't
   */
  test(element: string): boolean {
    const positions = this.getHashPositions(element);
    return positions.every((pos) => this.getBit(pos));
  }

  /**
   * Gets the underlying bit bucket array
   */
  get buckets(): Int32Array {
    return this.bits;
  }

  /**
   * Sets the underlying bit bucket array
   */
  set buckets(newBuckets: Int32Array) {
    this.bits = newBuckets;
  }

  /**
   * Generates k hash positions for an element using SHA-256
   * @param element - The element to hash
   * @returns Array of bit positions
   */
  private getHashPositions(element: string): number[] {
    const positions: number[] = [];
    const hash = createHash("sha256").update(element).digest();

    // Use different sections of the SHA-256 hash for each hash function
    for (let i = 0; i < this.k; i++) {
      // Use 4 bytes (32 bits) for each hash value
      const value = hash.readUInt32BE((i * 4) % (hash.length - 3));
      positions.push(value % this.m);
    }

    return positions;
  }

  /**
   * Sets a bit at the specified position
   * @param pos - The bit position to set
   */
  private setBit(pos: number): void {
    const bucketPos = Math.floor(pos / 32);
    const bitPos = pos % 32;
    this.bits[bucketPos] |= 1 << bitPos;
  }

  /**
   * Gets the value of a bit at the specified position
   * @param pos - The bit position to get
   * @returns The bit value (0 or 1)
   */
  private getBit(pos: number): boolean {
    const bucketPos = Math.floor(pos / 32);
    const bitPos = pos % 32;
    return (this.bits[bucketPos] & (1 << bitPos)) !== 0;
  }
}
