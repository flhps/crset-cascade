import { randomBytes } from "crypto";

/**
 * Generates a random 256-bit binary string.
 *
 * This function creates a 256-bit string by generating 32 random bytes
 * and converting each byte to its binary representation, ensuring each
 * byte is represented by 8 bits.
 *
 * @returns {string} A 256-bit binary string.
 */
export function generateRandom256BitString(): string {
  const bytes = randomBytes(32);
  return Array.from(bytes)
    .map((byte) => byte.toString(2).padStart(8, "0"))
    .join("");
}

/**
 * Converts a hexadecimal string to its binary representation
 *
 * @param hex - The hexadecimal string to convert (with or without '0x' prefix)
 * @returns The binary string representation
 */
export function hexToBinary(hex: string): string {
  // Remove '0x' prefix if present
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;

  // Map of hex digits to their 4-bit binary representations
  const hexToBinMap: { [key: string]: string } = {
    "0": "0000",
    "1": "0001",
    "2": "0010",
    "3": "0011",
    "4": "0100",
    "5": "0101",
    "6": "0110",
    "7": "0111",
    "8": "1000",
    "9": "1001",
    a: "1010",
    b: "1011",
    c: "1100",
    d: "1101",
    e: "1110",
    f: "1111",
    A: "1010",
    B: "1011",
    C: "1100",
    D: "1101",
    E: "1110",
    F: "1111",
  };

  return cleanHex
    .split("")
    .map((char) => hexToBinMap[char] || "0000")
    .join("");
}

/**
 * Converts a set of hexadecimal strings to a set of binary strings.
 *
 * @param {Set<string>} set - The set of hexadecimal strings to be converted.
 * @returns {Set<string>} A new set containing the binary string representations of the input hexadecimal strings.
 */
export function convertSetToBinary(set: Set<string>): Set<string> {
  const resultSet = new Set<string>();
  set.forEach((id) => {
    resultSet.add(hexToBinary(id));
  });
  return resultSet;
}

/**
 * Draws a specified number of unique random IDs and adds them to either the valid or revoked set.
 *
 * @param {Set<string>} validIds - A set of valid IDs.
 * @param {Set<string>} revokedIds - A set of revoked IDs.
 * @param {number} neededIteration - The number of unique IDs to generate and add.
 * @param {boolean} addToValidIds - If true, adds the generated IDs to the validIds set; otherwise, adds them to the revokedIds set.
 */
export function drawNFromSet(
  validIds: Set<string>,
  revokedIds: Set<string>,
  neededIteration: number,
  addToValidIds: boolean,
) {
  for (let i = 0; i < neededIteration; ) {
    const randomId = generateRandom256BitString();
    if (!validIds.has(randomId) && !revokedIds.has(randomId)) {
      if (addToValidIds) {
        validIds.add(randomId);
      } else {
        revokedIds.add(randomId);
      }
      i++;
    }
  }
}

/**
 * Converts a binary string to a Buffer.
 *
 * @param {string} binaryString - The binary string to be converted.
 * @returns {Buffer} A Buffer containing the binary string.
 */
export function binaryStringToBuffer(binaryString: string): Buffer {
  const byteArray = [];

  // Add padding to binary string if necessary
  const paddedBinaryString = binaryString.padStart(
    Math.ceil(binaryString.length / 8) * 8,
    "0",
  );

  // Convert every 8 bits into a byte (number)
  for (let i = 0; i < paddedBinaryString.length; i += 8) {
    const byte = paddedBinaryString.slice(i, i + 8);
    byteArray.push(parseInt(byte, 2));
  }

  return Buffer.from(byteArray);
}
