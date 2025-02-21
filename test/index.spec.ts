import { CRSetCascade } from "../src/lib/bloom-filter-cascade";
import { addUniqueRandomIdsToSet } from "../src/utils";

const validTestSet = new Set<string>();
const invalidTestSet = new Set<string>();

addUniqueRandomIdsToSet(validTestSet, invalidTestSet, 1000, true);
addUniqueRandomIdsToSet(validTestSet, invalidTestSet, 2000, false);

const cascade = CRSetCascade.fromSets(validTestSet, invalidTestSet, 3000);

test("if first layer of bloom filter is implemented correctly", () => {
  const filters = cascade.getLayers();
  const firstLayer = filters[0];

  validTestSet.forEach((id) => {
    const cascadeLevel = 1;
    id = id + cascadeLevel.toString(2).padStart(8, "0") + cascade.getSalt();
    expect(firstLayer?.test(id)).toBe(true);
  });
});

test("if second layer of bloom filter is implemented correctly", () => {
  const filters = cascade.getLayers();
  const firstLayer = filters[0];
  const secondLayer = filters[1];
  const falsePositives = new Set<string>();
  invalidTestSet.forEach((id) => {
    const cascadeLevel = 1;
    const id_test =
      id + cascadeLevel.toString(2).padStart(8, "0") + cascade.getSalt();
    if (firstLayer?.test(id_test)) {
      falsePositives.add(id);
    }
  });
  falsePositives.forEach((id) => {
    const cascadeLevel = 2;
    expect(
      secondLayer?.test(
        id + cascadeLevel.toString(2).padStart(8, "0") + cascade.getSalt(),
      ),
    ).toBe(true);
  });
});

test("if rHat minimum is enforced", () => {
  expect(() =>
    CRSetCascade.fromSets(validTestSet, invalidTestSet, 900),
  ).toThrow(RangeError);
});

test("if the valid VCs are in the cascade", () => {
  validTestSet.forEach((id) => {
    expect(cascade.has(id)).toBe(true);
  });
});

test("if the invalid VCs are not in the cascade", () => {
  invalidTestSet.forEach((id) => {
    expect(cascade.has(id)).toBe(false);
  });
});

test("if a deserialized cascade is equal to the original cascade", () => {
  const serialized = cascade.toDataHexString();
  const deserializedCascade = CRSetCascade.fromDataHexString(serialized);

  validTestSet.forEach((id) => {
    const originalResult = cascade.has(id);
    const deserializedResult = deserializedCascade.has(id);
    expect(originalResult).toBe(deserializedResult);
  });

  invalidTestSet.forEach((id) => {
    const originalResult = cascade.has(id);
    const deserializedResult = deserializedCascade.has(id);
    expect(originalResult).toBe(deserializedResult);
  });

  expect(cascade.getSalt()).toStrictEqual(deserializedCascade.getSalt());
  expect(cascade.getDepth()).toStrictEqual(deserializedCascade.getDepth());

  const originalFilters = cascade.getLayers();
  const deserializedFilters = deserializedCascade.getLayers();
  for (let i = 0; i < originalFilters.length; i++) {
    expect(originalFilters[i].buckets).toStrictEqual(
      deserializedFilters[i].buckets,
    );
  }
});

test("if a deserialized cascade with appended zeros is equal to the original cascade", () => {
  const serialized =
    cascade.toDataHexString() + "00000000000000000000000000000000";
  const deserializedCascade = CRSetCascade.fromDataHexString(serialized);

  validTestSet.forEach((id) => {
    const originalResult = cascade.has(id);
    const deserializedResult = deserializedCascade.has(id);
    expect(originalResult).toBe(deserializedResult);
  });

  invalidTestSet.forEach((id) => {
    const originalResult = cascade.has(id);
    const deserializedResult = deserializedCascade.has(id);
    expect(originalResult).toBe(deserializedResult);
  });

  expect(cascade.getSalt()).toStrictEqual(deserializedCascade.getSalt());
  expect(cascade.getDepth()).toStrictEqual(deserializedCascade.getDepth());

  const originalFilters = cascade.getLayers();
  const deserializedFilters = deserializedCascade.getLayers();
  for (let i = 0; i < originalFilters.length; i++) {
    expect(originalFilters[i].buckets).toStrictEqual(
      deserializedFilters[i].buckets,
    );
  }
});
