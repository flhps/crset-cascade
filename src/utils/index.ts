import { randomBytes } from "crypto";

/**
 * Generates a random 256-bit hex string that can be used as an ID for the status field of a credential.
 *
 * @returns {string} A 256-bit hex string (64 characters) without prefix.
 */
export function random256BitHexString(): string {
  const bytes = randomBytes(32);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Draws a specified number of unique random IDs and adds them to either the valid or revoked set.
 *
 * @param {Set<string>} validIds - A set of valid IDs.
 * @param {Set<string>} revokedIds - A set of revoked IDs.
 * @param {number} neededIteration - The number of unique IDs to generate and add.
 * @param {boolean} addToValidIds - If true, adds the generated IDs to the validIds set; otherwise, adds them to the revokedIds set.
 */
export function addUniqueRandomIdsToSet(
  validIds: Set<string>,
  revokedIds: Set<string>,
  neededIteration: number,
  addToValidIds: boolean,
) {
  for (let i = 0; i < neededIteration; ) {
    const randomId = random256BitHexString();
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
